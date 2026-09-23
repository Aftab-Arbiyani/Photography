import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthProvider, type PublicUser, UserRole } from '@photography/types';
import { normalizePagination, paginate } from '@photography/utils';
import type { Paginated } from '@photography/types';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { User } from './entities/user.entity';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { toPublicUser } from './user.mapper';

export interface CreateUserData {
  email: string;
  passwordHash?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: UserRole;
  provider?: AuthProvider;
  googleId?: string | null;
  avatarUrl?: string | null;
  isEmailVerified?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ---- queries used by AuthService ----

  /** Find by email INCLUDING the password hash (which is `select: false` by default). */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { googleId } });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async getByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(data: CreateUserData): Promise<User> {
    const user = this.userRepository.create({
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash ?? null,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      role: data.role ?? UserRole.USER,
      provider: data.provider ?? AuthProvider.LOCAL,
      googleId: data.googleId ?? null,
      avatarUrl: data.avatarUrl ?? null,
      isEmailVerified: data.isEmailVerified ?? false,
    });
    return this.userRepository.save(user);
  }

  async markEmailVerified(id: string): Promise<void> {
    await this.userRepository.update({ id }, { isEmailVerified: true });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.userRepository.update({ id }, { passwordHash });
  }

  async recordLogin(id: string): Promise<void> {
    await this.userRepository.update({ id }, { lastLoginAt: new Date() });
  }

  // ---- profile / admin ----

  async getProfile(id: string): Promise<PublicUser> {
    return toPublicUser(await this.getByIdOrThrow(id));
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<PublicUser> {
    const user = await this.getByIdOrThrow(id);
    Object.assign(user, dto);
    return toPublicUser(await this.userRepository.save(user));
  }

  async adminUpdate(id: string, dto: AdminUpdateUserDto): Promise<PublicUser> {
    const user = await this.getByIdOrThrow(id);
    Object.assign(user, dto);
    return toPublicUser(await this.userRepository.save(user));
  }

  async findAll(query: PaginationQueryDto): Promise<Paginated<PublicUser>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const qb = this.userRepository.createQueryBuilder('user');

    if (query.search) {
      qb.where('user.email ILIKE :s OR user.first_name ILIKE :s OR user.last_name ILIKE :s', {
        s: `%${query.search}%`,
      });
    }

    const sortable = new Set(['createdAt', 'email', 'role']);
    const sortBy = sortable.has(query.sortBy) ? query.sortBy : 'createdAt';
    qb.orderBy(`user.${sortBy}`, query.sortOrder).skip(skip).take(limit);

    const [users, total] = await qb.getManyAndCount();
    return paginate(users.map(toPublicUser), total, page, limit);
  }

  async softDelete(id: string): Promise<void> {
    await this.getByIdOrThrow(id);
    await this.userRepository.softDelete({ id });
  }
}
