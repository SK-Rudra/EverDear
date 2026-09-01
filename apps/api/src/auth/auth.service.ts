import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AuthenticatedUser,
  AuthenticationResult,
  SessionMetadata,
} from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import { PasswordService } from './password.service.js';
import { SessionService } from './session.service.js';

const INVALID_CREDENTIALS_MESSAGE =
  'Invalid email or password';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
  ) {}

  async register(
    registerDto: RegisterDto,
    metadata: SessionMetadata,
  ): Promise<AuthenticationResult> {
    const passwordHash =
      await this.passwordService.hashPassword(
        registerDto.password,
      );

    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          const user = await transaction.user.create({
            data: {
              name: registerDto.name,
              email: registerDto.email,
              passwordHash,
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              emailVerifiedAt: true,
              createdAt: true,
            },
          });

          const session =
            await this.sessionService.createSessionInTransaction(
              transaction,
              user.id,
              metadata,
            );

          return {
            user,
            session,
          };
        },
      );
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }

      throw error;
    }
  }

  async login(
    loginDto: LoginDto,
    metadata: SessionMetadata,
  ): Promise<AuthenticationResult> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      await this.passwordService.hashPassword(
        loginDto.password,
      );

      throw new UnauthorizedException(
        INVALID_CREDENTIALS_MESSAGE,
      );
    }

    const passwordIsValid =
      await this.passwordService.verifyPassword(
        user.passwordHash,
        loginDto.password,
      );

    if (!passwordIsValid || !user.isActive) {
      throw new UnauthorizedException(
        INVALID_CREDENTIALS_MESSAGE,
      );
    }

    const session =
      await this.sessionService.createSession(
        user.id,
        metadata,
      );

    return {
      user: this.toAuthenticatedUser(user),
      session,
    };
  }

  logout(token: unknown): Promise<boolean> {
    return this.sessionService.revokeSession(token);
  }

  private toAuthenticatedUser(user: {
    id: string;
    name: string;
    email: string;
    role: AuthenticatedUser['role'];
    emailVerifiedAt: Date | null;
    createdAt: Date;
  }): AuthenticatedUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
    };
  }

  private isUniqueConstraintError(
    error: unknown,
  ): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}