import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import type { PublicFeatureFlag } from '@photography/types';
import { RedisService } from '../../redis/redis.service';
import { FeatureFlag } from './entities/feature-flag.entity';

const CACHE_TTL = 30;

@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectRepository(FeatureFlag) private readonly flagRepository: Repository<FeatureFlag>,
    private readonly redis: RedisService,
  ) {}

  private key(flag: string): string {
    return `flag:${flag}`;
  }

  /** Cached flag lookup with deterministic percentage rollout per subject. */
  async isEnabled(key: string, subjectId?: string): Promise<boolean> {
    let flag = await this.redis.get<{ enabled: boolean; rollout: number } | null>(this.key(key));
    if (flag === null) {
      const row = await this.flagRepository.findOne({ where: { key } });
      flag = row
        ? { enabled: row.enabled, rollout: row.rolloutPercentage }
        : { enabled: false, rollout: 0 };
      await this.redis.set(this.key(key), flag, CACHE_TTL);
    }
    if (!flag.enabled) return false;
    if (flag.rollout >= 100) return true;
    if (flag.rollout <= 0) return false;
    if (!subjectId) return flag.rollout >= 100;
    // Deterministic bucket 0–99 from a hash of (key, subject).
    const bucket =
      parseInt(createHash('sha256').update(`${key}:${subjectId}`).digest('hex').slice(0, 8), 16) %
      100;
    return bucket < flag.rollout;
  }

  async list(): Promise<FeatureFlag[]> {
    return this.flagRepository.find({ order: { key: 'ASC' } });
  }

  async publicList(): Promise<PublicFeatureFlag[]> {
    const flags = await this.flagRepository.find({ where: { enabled: true } });
    return flags.map((f) => ({ key: f.key, enabled: f.enabled, description: f.description }));
  }

  async upsert(key: string, data: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const existing = await this.flagRepository.findOne({ where: { key } });
    const flag = existing
      ? Object.assign(existing, data)
      : this.flagRepository.create({ key, enabled: false, rolloutPercentage: 100, ...data });
    const saved = await this.flagRepository.save(flag);
    await this.redis.del(this.key(key));
    return saved;
  }
}
