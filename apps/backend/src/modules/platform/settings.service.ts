import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../../redis/redis.service';
import { PlatformSetting } from './entities/platform-setting.entity';

const CACHE_TTL = 60;

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(PlatformSetting)
    private readonly settingRepository: Repository<PlatformSetting>,
    private readonly redis: RedisService,
  ) {}

  private key(k: string): string {
    return `setting:${k}`;
  }

  /** Typed get with default fallback (cached). */
  async get<T>(key: string, fallback: T): Promise<T> {
    const cached = await this.redis.get<{ v: T }>(this.key(key));
    if (cached) return cached.v;
    const row = await this.settingRepository.findOne({ where: { key } });
    const value = (row ? (row.value as T) : fallback) ?? fallback;
    await this.redis.set(this.key(key), { v: value }, CACHE_TTL);
    return value;
  }

  async all(): Promise<PlatformSetting[]> {
    return this.settingRepository.find({ order: { category: 'ASC', key: 'ASC' } });
  }

  async publicSettings(): Promise<Record<string, unknown>> {
    const rows = await this.settingRepository.find({ where: { isPublic: true } });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  async set(
    key: string,
    value: unknown,
    meta?: Partial<PlatformSetting>,
  ): Promise<PlatformSetting> {
    const existing = await this.settingRepository.findOne({ where: { key } });
    const setting = existing
      ? Object.assign(existing, { value, ...meta })
      : this.settingRepository.create({
          key,
          value,
          category: meta?.category ?? 'general',
          ...meta,
        });
    const saved = await this.settingRepository.save(setting);
    await this.redis.del(this.key(key));
    return saved;
  }

  async remove(key: string): Promise<void> {
    const result = await this.settingRepository.delete({ key });
    if (!result.affected) throw new NotFoundException('Setting not found');
    await this.redis.del(this.key(key));
  }
}
