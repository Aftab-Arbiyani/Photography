import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthProvider, UserRole } from '@photography/types';
import { AuthService } from './auth.service';
import type { UsersService } from '../users/users.service';
import type { TokenService } from './token.service';
import type { MailService } from '../../mail/mail.service';
import type { User } from '../users/entities/user.entity';

const buildUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'u1',
    email: 'jane@example.com',
    passwordHash: null,
    firstName: 'Jane',
    lastName: 'Doe',
    role: UserRole.USER,
    provider: AuthProvider.LOCAL,
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    get displayName() {
      return 'Jane Doe';
    },
    ...overrides,
  }) as User;

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<Pick<UsersService, 'findByEmail' | 'create' | 'findByEmailWithPassword'>>;
  let tokens: jest.Mocked<Pick<TokenService, 'issueTokens' | 'signVerificationToken'>>;
  let mail: jest.Mocked<Pick<MailService, 'sendVerificationEmail'>>;

  beforeEach(() => {
    users = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findByEmailWithPassword: jest.fn(),
    } as never;
    tokens = {
      issueTokens: jest.fn().mockResolvedValue({
        accessToken: 'a',
        refreshToken: 'r',
        tokenType: 'Bearer',
        expiresIn: 900,
      }),
      signVerificationToken: jest.fn().mockResolvedValue('verify-token'),
    } as never;
    mail = { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) } as never;

    service = new AuthService(users as never, tokens as never, mail as never);
  });

  describe('register', () => {
    it('rejects a duplicate email', async () => {
      users.findByEmail.mockResolvedValue(buildUser());
      await expect(
        service.register({ email: 'jane@example.com', password: 'S3cure!Pass' }, {}),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('hashes the password, sends verification, and returns tokens', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockImplementation(async (d) =>
        buildUser({ passwordHash: d.passwordHash ?? null }),
      );

      const result = await service.register(
        { email: 'jane@example.com', password: 'S3cure!Pass', firstName: 'Jane' },
        {},
      );

      const created = users.create.mock.calls[0][0];
      expect(created.passwordHash).toBeDefined();
      expect(created.passwordHash).not.toEqual('S3cure!Pass');
      await expect(argon2.verify(created.passwordHash as string, 'S3cure!Pass')).resolves.toBe(
        true,
      );
      expect(mail.sendVerificationEmail).toHaveBeenCalled();
      expect(result.tokens.accessToken).toEqual('a');
    });
  });

  describe('validateCredentials', () => {
    it('throws when the user has no password (OAuth account)', async () => {
      users.findByEmailWithPassword.mockResolvedValue(buildUser({ passwordHash: null }));
      await expect(service.validateCredentials('jane@example.com', 'x')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws on wrong password', async () => {
      const hash = await argon2.hash('correct-horse');
      users.findByEmailWithPassword.mockResolvedValue(buildUser({ passwordHash: hash }));
      await expect(service.validateCredentials('jane@example.com', 'wrong')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('returns the user on correct password', async () => {
      const hash = await argon2.hash('correct-horse');
      const user = buildUser({ passwordHash: hash });
      users.findByEmailWithPassword.mockResolvedValue(user);
      await expect(service.validateCredentials('jane@example.com', 'correct-horse')).resolves.toBe(
        user,
      );
    });
  });
});
