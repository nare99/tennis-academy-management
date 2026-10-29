import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { SESSION_DURATION_MS } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PublicUser } from './auth.types';

interface SessionCredentials {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ user: PublicUser; session: SessionCredentials }> {
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const session = this.createSessionCredentials();

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email,
            name: dto.name.trim(),
            passwordHash,
            role: 'CUSTOMER',
          },
        });

        await tx.authSession.create({
          data: {
            tokenHash: this.hashToken(session.token),
            userId: createdUser.id,
            expiresAt: session.expiresAt,
          },
        });

        return createdUser;
      });

      return { user: this.toPublicUser(user), session };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this email already exists.',
        );
      }

      throw error;
    }
  }

  async login(
    dto: LoginDto,
  ): Promise<{ user: PublicUser; session: SessionCredentials }> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Use the same response for unknown emails and invalid passwords.
    if (
      !user ||
      !user.passwordHash ||
      !user.isActive ||
      !(await argon2.verify(user.passwordHash, dto.password))
    ) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const session = this.createSessionCredentials();

    await this.prisma.authSession.create({
      data: {
        tokenHash: this.hashToken(session.token),
        userId: user.id,
        expiresAt: session.expiresAt,
      },
    });

    return { user: this.toPublicUser(user), session };
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }

    await this.prisma.authSession.deleteMany({
      where: { tokenHash: this.hashToken(token) },
    });
  }

  async validateSession(token: string): Promise<PublicUser | null> {
    const tokenHash = this.hashToken(token);

    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.authSession.deleteMany({
        where: { id: session.id },
      });
      return null;
    }

    if (!session.user.isActive) {
      return null;
    }

    return this.toPublicUser(session.user);
  }

  private createSessionCredentials(): SessionCredentials {
    return {
      token: randomBytes(32).toString('base64url'),
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
