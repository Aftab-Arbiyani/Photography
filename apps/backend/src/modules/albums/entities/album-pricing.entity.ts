import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { LicenseType } from '@photography/types';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Album } from './album.entity';

/** A purchasable license tier for an album. Prices are integer minor units (cents). */
@Entity('album_pricing')
@Index('idx_album_pricing_album', ['albumId'])
export class AlbumPricing extends BaseEntity {
  @Column({ name: 'album_id', type: 'uuid' })
  albumId!: string;

  @ManyToOne(() => Album, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'album_id' })
  album!: Album;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'license_type', type: 'enum', enum: LicenseType, default: LicenseType.STANDARD })
  licenseType!: LicenseType;

  @Column({ name: 'price_cents', type: 'int' })
  priceCents!: number;

  @Column({ type: 'varchar', length: 3, default: 'usd' })
  currency!: string;

  @Column({ name: 'download_limit', type: 'int', default: 5 })
  downloadLimit!: number;

  @Column({ name: 'includes_raw', type: 'boolean', default: false })
  includesRaw!: boolean;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;
}
