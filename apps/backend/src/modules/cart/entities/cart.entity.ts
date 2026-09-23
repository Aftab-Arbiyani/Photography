import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Coupon } from '../../coupons/entities/coupon.entity';
import { CartItem } from './cart-item.entity';

/** One persistent cart per user. */
@Entity('carts')
export class Cart extends BaseEntity {
  @Index('uq_carts_user', { unique: true })
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'coupon_id', type: 'uuid', nullable: true })
  couponId!: string | null;

  @ManyToOne(() => Coupon, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'coupon_id' })
  coupon!: Coupon | null;

  @OneToMany(() => CartItem, (item) => item.cart)
  items!: CartItem[];
}
