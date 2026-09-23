import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentStatus, type CartLineItem, type PublicCart } from '@photography/types';
import type { CommerceConfig } from '../../config/configuration';
import { Album } from '../albums/entities/album.entity';
import { AlbumPricing } from '../albums/entities/album-pricing.entity';
import { CouponsService } from '../coupons/coupons.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { PricingService, type PricingLine } from './pricing.service';

/** A fully-resolved cart line used both for display and for order creation. */
export interface ResolvedCartLine {
  item: CartItem;
  album: Album;
  pricing: AlbumPricing;
  originalCents: number;
  effectiveCents: number;
}

@Injectable()
export class CartService {
  private readonly commerce: CommerceConfig;

  constructor(
    @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem) private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Album) private readonly albumRepository: Repository<Album>,
    @InjectRepository(AlbumPricing) private readonly pricingRepository: Repository<AlbumPricing>,
    private readonly couponsService: CouponsService,
    private readonly pricingService: PricingService,
    configService: ConfigService,
  ) {
    this.commerce = configService.getOrThrow<CommerceConfig>('commerce');
  }

  private async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({ where: { userId } });
    if (!cart) {
      cart = await this.cartRepository.save(this.cartRepository.create({ userId }));
    }
    return cart;
  }

  /** Resolve every cart line with its album + pricing and computed effective price. */
  async resolveLines(cartId: string): Promise<ResolvedCartLine[]> {
    const items = await this.cartItemRepository.find({
      where: { cartId },
      relations: { album: true, pricing: true },
      order: { createdAt: 'ASC' },
    });
    return items
      .filter((i) => i.album && i.pricing)
      .map((item) => {
        const effectiveCents = PricingService.applyDiscount(
          item.pricing.priceCents,
          item.album.discountPercent,
          item.album.discountActive,
        );
        return {
          item,
          album: item.album,
          pricing: item.pricing,
          originalCents: item.pricing.priceCents,
          effectiveCents,
        };
      });
  }

  /** Build the API-facing cart with totals (and coupon, if applied & still valid). */
  async view(userId: string): Promise<PublicCart> {
    const cart = await this.getOrCreateCart(userId);
    const resolved = await this.resolveLines(cart.id);

    const items: CartLineItem[] = resolved.map((l) => ({
      id: l.item.id,
      albumId: l.album.id,
      albumTitle: l.album.title,
      albumSlug: l.album.slug,
      coverPhotoId: l.album.coverPhotoId,
      pricingId: l.pricing.id,
      pricingName: l.pricing.name,
      licenseType: l.pricing.licenseType,
      unitPriceCents: l.effectiveCents,
      currency: l.pricing.currency,
    }));

    const lines: PricingLine[] = resolved.map((l) => ({
      originalCents: l.originalCents,
      effectiveCents: l.effectiveCents,
    }));

    const { couponCents, couponCode } = await this.resolveCoupon(cart, lines);
    const totals = this.pricingService.computeTotals({
      lines,
      couponCents,
      couponCode,
      taxBasisPoints: this.commerce.taxBasisPoints,
      currency: this.commerce.currency,
    });

    return { id: cart.id, items, totals };
  }

  /** Re-validate any applied coupon against the current subtotal; drop it silently if invalid. */
  private async resolveCoupon(
    cart: Cart,
    lines: PricingLine[],
  ): Promise<{ couponCents: number; couponCode: string | null }> {
    if (!cart.couponId) return { couponCents: 0, couponCode: null };
    const afterDiscount = lines.reduce((s, l) => s + l.effectiveCents, 0);
    const withCoupon = await this.cartRepository.findOne({
      where: { id: cart.id },
      relations: { coupon: true },
    });
    const code = withCoupon?.coupon?.code;
    if (!code) return { couponCents: 0, couponCode: null };
    try {
      const { coupon, discountCents } = await this.couponsService.validate(code, afterDiscount);
      return { couponCents: discountCents, couponCode: coupon.code };
    } catch {
      // Coupon became invalid (expired / under minimum) — ignore it for display.
      return { couponCents: 0, couponCode: null };
    }
  }

  async addItem(userId: string, albumId: string, pricingId: string): Promise<PublicCart> {
    const album = await this.albumRepository.findOne({ where: { id: albumId } });
    if (!album || !album.isForSale || album.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundException('Album is not available for purchase');
    }
    const pricing = await this.pricingRepository.findOne({ where: { id: pricingId, albumId } });
    if (!pricing) throw new BadRequestException('Invalid pricing tier for this album');

    const cart = await this.getOrCreateCart(userId);
    const existing = await this.cartItemRepository.findOne({ where: { cartId: cart.id, albumId } });
    if (existing) {
      existing.pricingId = pricingId;
      await this.cartItemRepository.save(existing);
    } else {
      await this.cartItemRepository.insert({ cartId: cart.id, albumId, pricingId });
    }
    return this.view(userId);
  }

  async removeItem(userId: string, albumId: string): Promise<PublicCart> {
    const cart = await this.getOrCreateCart(userId);
    await this.cartItemRepository.delete({ cartId: cart.id, albumId });
    return this.view(userId);
  }

  async clear(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    await this.cartItemRepository.delete({ cartId: cart.id });
    await this.cartRepository.update({ id: cart.id }, { couponId: null });
  }

  async applyCoupon(userId: string, code: string): Promise<PublicCart> {
    const cart = await this.getOrCreateCart(userId);
    const resolved = await this.resolveLines(cart.id);
    const afterDiscount = resolved.reduce((s, l) => s + l.effectiveCents, 0);
    // Validates (throws 400 on invalid); persist the link on success.
    const { coupon } = await this.couponsService.validate(code, afterDiscount);
    await this.cartRepository.update({ id: cart.id }, { couponId: coupon.id });
    return this.view(userId);
  }

  async removeCoupon(userId: string): Promise<PublicCart> {
    const cart = await this.getOrCreateCart(userId);
    await this.cartRepository.update({ id: cart.id }, { couponId: null });
    return this.view(userId);
  }

  /** Used by checkout — returns resolved lines + cart entity for order creation. */
  async getCheckoutContext(userId: string): Promise<{ cart: Cart; lines: ResolvedCartLine[] }> {
    const cart = await this.getOrCreateCart(userId);
    const lines = await this.resolveLines(cart.id);
    if (lines.length === 0) throw new BadRequestException('Your cart is empty');
    return { cart, lines };
  }
}
