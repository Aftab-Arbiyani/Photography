import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponType } from '@photography/types';
import { Coupon } from './entities/coupon.entity';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

export interface CouponValidation {
  coupon: Coupon;
  discountCents: number;
}

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  /** Compute the discount a coupon yields for a subtotal (never exceeds the subtotal). */
  computeDiscount(coupon: Coupon, subtotalCents: number): number {
    const raw =
      coupon.type === CouponType.PERCENT
        ? Math.round((subtotalCents * coupon.value) / 100)
        : coupon.value;
    return Math.min(Math.max(raw, 0), subtotalCents);
  }

  /** Validate a code against a subtotal; throws a clear 400 on any failure. */
  async validate(code: string, subtotalCents: number): Promise<CouponValidation> {
    const coupon = await this.couponRepository.findOne({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid coupon code');
    }
    const now = Date.now();
    if (coupon.validFrom && coupon.validFrom.getTime() > now) {
      throw new BadRequestException('Coupon is not active yet');
    }
    if (coupon.validUntil && coupon.validUntil.getTime() < now) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.maxRedemptions !== null && coupon.redeemedCount >= coupon.maxRedemptions) {
      throw new BadRequestException('Coupon redemption limit reached');
    }
    if (subtotalCents < coupon.minSubtotalCents) {
      throw new BadRequestException(
        `Minimum subtotal for this coupon is ${(coupon.minSubtotalCents / 100).toFixed(2)}`,
      );
    }
    return { coupon, discountCents: this.computeDiscount(coupon, subtotalCents) };
  }

  /** Atomically increment redemption count (called on order fulfillment). */
  async redeem(couponId: string): Promise<void> {
    await this.couponRepository.increment({ id: couponId }, 'redeemedCount', 1);
  }

  async redeemByCode(code: string): Promise<void> {
    await this.couponRepository.increment({ code: code.toUpperCase() }, 'redeemedCount', 1);
  }

  // ---- admin CRUD ----

  async create(dto: CreateCouponDto): Promise<Coupon> {
    const code = dto.code.toUpperCase();
    if (await this.couponRepository.findOne({ where: { code } })) {
      throw new ConflictException('Coupon code already exists');
    }
    const coupon = this.couponRepository.create({
      ...dto,
      code,
      minSubtotalCents: dto.minSubtotalCents ?? 0,
      maxRedemptions: dto.maxRedemptions ?? null,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
    });
    return this.couponRepository.save(coupon);
  }

  findAll(): Promise<Coupon[]> {
    return this.couponRepository.find({ order: { createdAt: 'DESC' } });
  }

  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    Object.assign(coupon, {
      ...dto,
      code: dto.code ? dto.code.toUpperCase() : coupon.code,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : coupon.validFrom,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : coupon.validUntil,
    });
    return this.couponRepository.save(coupon);
  }

  async remove(id: string): Promise<void> {
    const result = await this.couponRepository.softDelete({ id });
    if (!result.affected) throw new NotFoundException('Coupon not found');
  }
}
