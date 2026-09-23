import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Album } from '../../albums/entities/album.entity';
import { AlbumPricing } from '../../albums/entities/album-pricing.entity';
import { Cart } from './cart.entity';

/** A chosen album + pricing tier. One album may appear once per cart. */
@Entity('cart_items')
@Unique('uq_cart_items_cart_album', ['cartId', 'albumId'])
@Index('idx_cart_items_cart', ['cartId'])
export class CartItem extends BaseEntity {
  @Column({ name: 'cart_id', type: 'uuid' })
  cartId!: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart!: Cart;

  @Column({ name: 'album_id', type: 'uuid' })
  albumId!: string;

  @ManyToOne(() => Album, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'album_id' })
  album!: Album;

  @Column({ name: 'pricing_id', type: 'uuid' })
  pricingId!: string;

  @ManyToOne(() => AlbumPricing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pricing_id' })
  pricing!: AlbumPricing;
}
