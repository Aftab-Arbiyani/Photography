import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { AppConfig } from '../../config/configuration';
import { StripeService } from '../payments/stripe.service';
import {
  ApplicationStatus,
  NotificationType,
  type Paginated,
  type PublicPhotographerApplication,
  type PublicPhotographerProfile,
  UserRole,
  VerificationStatus,
} from '@photography/types';
import { displayName, normalizePagination, paginate } from '@photography/utils';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { PhotographerApplication } from './entities/photographer-application.entity';
import { PhotographerProfile } from './entities/photographer-profile.entity';
import {
  ApplyPhotographerDto,
  ReviewApplicationDto,
  UpdatePhotographerProfileDto,
} from './dto/photographer.dto';

@Injectable()
export class PhotographersService {
  constructor(
    @InjectRepository(PhotographerApplication)
    private readonly applicationRepository: Repository<PhotographerApplication>,
    @InjectRepository(PhotographerProfile)
    private readonly profileRepository: Repository<PhotographerProfile>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
    private readonly stripe: StripeService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Start (or resume) Stripe Connect onboarding for the current photographer.
   * Creates an Express account on first call, then returns a hosted onboarding URL.
   */
  async startConnectOnboarding(userId: string): Promise<{ url: string }> {
    const profile = await this.getProfileEntity(userId);
    const user = await this.userRepository.findOneByOrFail({ id: userId });

    if (!profile.stripeAccountId) {
      profile.stripeAccountId = await this.stripe.createConnectAccount(user.email, { userId });
      await this.profileRepository.save(profile);
    }

    const frontendUrl = this.config.getOrThrow<AppConfig>('app').frontendUrl;
    const url = await this.stripe.createAccountOnboardingLink(
      profile.stripeAccountId,
      `${frontendUrl}/dashboard/photographer?connect=refresh`,
      `${frontendUrl}/dashboard/photographer?connect=done`,
    );
    return { url };
  }

  /** Whether the photographer's connected account can receive payouts yet. */
  async getConnectStatus(userId: string): Promise<{ connected: boolean; payoutsEnabled: boolean }> {
    const profile = await this.getProfileEntity(userId);
    if (!profile.stripeAccountId) return { connected: false, payoutsEnabled: false };
    const payoutsEnabled = await this.stripe
      .getAccountPayoutsEnabled(profile.stripeAccountId)
      .catch(() => false);
    return { connected: true, payoutsEnabled };
  }

  private toPublicApplication(a: PhotographerApplication): PublicPhotographerApplication {
    return {
      id: a.id,
      userId: a.userId,
      status: a.status,
      statement: a.statement,
      portfolioUrl: a.portfolioUrl,
      reviewNote: a.reviewNote,
      createdAt: a.createdAt.toISOString(),
    };
  }

  private toPublicProfile(p: PhotographerProfile, name: string): PublicPhotographerProfile {
    return {
      id: p.id,
      userId: p.userId,
      displayName: name,
      headline: p.headline,
      verificationStatus: p.verificationStatus,
      isVerified: p.verificationStatus === VerificationStatus.VERIFIED,
      commissionRate: Number(p.commissionRate),
      createdAt: p.createdAt.toISOString(),
    };
  }

  // ---- application ----

  async apply(userId: string, dto: ApplyPhotographerDto): Promise<PublicPhotographerApplication> {
    const user = await this.userRepository.findOneByOrFail({ id: userId });
    if (user.role === UserRole.PHOTOGRAPHER || user.role === UserRole.ADMIN) {
      throw new BadRequestException('You are already a photographer');
    }
    const pending = await this.applicationRepository.findOne({
      where: { userId, status: ApplicationStatus.PENDING },
    });
    if (pending) throw new ConflictException('You already have a pending application');

    const application = await this.applicationRepository.save(
      this.applicationRepository.create({
        userId,
        statement: dto.statement,
        portfolioUrl: dto.portfolioUrl ?? null,
        status: ApplicationStatus.PENDING,
      }),
    );
    return this.toPublicApplication(application);
  }

  async myApplication(userId: string): Promise<PublicPhotographerApplication | null> {
    const application = await this.applicationRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return application ? this.toPublicApplication(application) : null;
  }

  async adminList(
    query: PaginationQueryDto & { status?: ApplicationStatus },
  ): Promise<Paginated<PublicPhotographerApplication>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [rows, total] = await this.applicationRepository.findAndCount({
      where: query.status ? { status: query.status } : {},
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return paginate(
      rows.map((r) => this.toPublicApplication(r)),
      total,
      page,
      limit,
    );
  }

  /** Approve (→ upgrade role + create profile) or reject an application. */
  async review(
    applicationId: string,
    adminId: string,
    dto: ReviewApplicationDto,
  ): Promise<PublicPhotographerApplication> {
    const application = await this.applicationRepository.findOne({ where: { id: applicationId } });
    if (!application) throw new NotFoundException('Application not found');

    application.status = dto.status;
    application.reviewNote = dto.reviewNote ?? null;
    application.reviewedBy = adminId;

    if (dto.status === ApplicationStatus.APPROVED) {
      await this.dataSource.transaction(async (manager) => {
        await manager.save(application);
        // Additive role upgrade — single-photographer setups are unaffected.
        await manager.update(User, { id: application.userId }, { role: UserRole.PHOTOGRAPHER });
        const exists = await manager.findOne(PhotographerProfile, {
          where: { userId: application.userId },
        });
        if (!exists) {
          await manager.save(manager.create(PhotographerProfile, { userId: application.userId }));
        }
      });
      await this.notifications.emit({
        userId: application.userId,
        type: NotificationType.SYSTEM,
        title: 'You’re now a photographer',
        body: 'Your application was approved. Set up your profile and start uploading.',
        linkUrl: '/dashboard/photographer',
      });
    } else {
      await this.applicationRepository.save(application);
      if (dto.status === ApplicationStatus.REJECTED) {
        await this.notifications.emit({
          userId: application.userId,
          type: NotificationType.SYSTEM,
          title: 'Application update',
          body: dto.reviewNote ?? 'Your photographer application was not approved.',
        });
      }
    }
    return this.toPublicApplication(application);
  }

  // ---- profile ----

  async getProfileEntity(userId: string): Promise<PhotographerProfile> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Photographer profile not found');
    return profile;
  }

  async getPublicProfile(userId: string): Promise<PublicPhotographerProfile> {
    const profile = await this.getProfileEntity(userId);
    const user = await this.userRepository.findOneByOrFail({ id: userId });
    return this.toPublicProfile(profile, displayName(user.firstName, user.lastName, user.email));
  }

  async updateMyProfile(
    userId: string,
    dto: UpdatePhotographerProfileDto,
  ): Promise<PublicPhotographerProfile> {
    const profile = await this.getProfileEntity(userId);
    Object.assign(profile, {
      headline: dto.headline ?? profile.headline,
      payoutMethod: dto.payoutMethod ?? profile.payoutMethod,
      payoutDetails: dto.payoutDetails ?? profile.payoutDetails,
    });
    await this.profileRepository.save(profile);
    const user = await this.userRepository.findOneByOrFail({ id: userId });
    return this.toPublicProfile(profile, displayName(user.firstName, user.lastName, user.email));
  }

  // ---- admin: verification + commission ----

  async setVerification(
    userId: string,
    status: VerificationStatus,
  ): Promise<PublicPhotographerProfile> {
    const profile = await this.getProfileEntity(userId);
    profile.verificationStatus = status;
    profile.verifiedAt = status === VerificationStatus.VERIFIED ? new Date() : null;
    await this.profileRepository.save(profile);
    await this.notifications.emit({
      userId,
      type: NotificationType.SYSTEM,
      title: status === VerificationStatus.VERIFIED ? 'You’re verified' : 'Verification update',
      body: `Your verification status is now ${status}.`,
    });
    const user = await this.userRepository.findOneByOrFail({ id: userId });
    return this.toPublicProfile(profile, displayName(user.firstName, user.lastName, user.email));
  }

  async setCommission(userId: string, commissionRate: number): Promise<PublicPhotographerProfile> {
    const profile = await this.getProfileEntity(userId);
    profile.commissionRate = commissionRate;
    await this.profileRepository.save(profile);
    const user = await this.userRepository.findOneByOrFail({ id: userId });
    return this.toPublicProfile(profile, displayName(user.firstName, user.lastName, user.email));
  }
}
