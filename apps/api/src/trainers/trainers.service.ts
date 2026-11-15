import {
  BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, User, UserRole } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AcceptTrainerInvitationDto } from './dto/accept-trainer-invitation.dto';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';

const INVITATION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_INVITATION_BASE_URL = 'http://localhost:5174/accept-invitation';

@Injectable()
export class TrainersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findAll() {
    const now = new Date();
    const trainers = await this.prisma.user.findMany({
      where: { role: UserRole.TRAINER },
      select: {
        id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true,
        trainerProfile: {
          select: { id: true, bio: true, hourlyRateMinor: true, currency: true, createdAt: true, updatedAt: true },
        },
        trainerInvitations: {
          where: { consumedAt: null, expiresAt: { gt: now } },
          select: { expiresAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    return trainers.map(({ trainerInvitations, ...trainer }) => ({
      ...trainer,
      status: trainer.isActive ? 'ACTIVE' : trainerInvitations.length ? 'INVITED' : 'INACTIVE',
      invitationExpiresAt: trainerInvitations[0]?.expiresAt ?? null,
    }));
  }

  async create(dto: CreateTrainerDto) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email.trim().toLowerCase(),
            name: dto.name.trim(),
            role: UserRole.TRAINER,
            isActive: false,
          },
        });
        const profile = await tx.trainerProfile.create({
          data: {
            userId: user.id,
            bio: dto.bio?.trim() || null,
            hourlyRateMinor: dto.hourlyRateMinor ?? null,
            currency: dto.currency ?? 'AMD',
          },
        });
        const invitation = await this.createInvitation(tx, user.id);
        return { user, profile, invitation };
      });

      return {
        trainer: this.toTrainerResponse(result.user, result.profile, 'INVITED', result.invitation.expiresAt),
        invitationUrl: result.invitation.url,
        invitationExpiresAt: result.invitation.expiresAt,
      };
    } catch (error: unknown) {
      if (this.isPrismaError(error, 'P2002')) {
        throw new ConflictException('A user with this email already exists.');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateTrainerDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Provide at least one trainer field to update.');
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.user.findFirst({
          where: { id, role: UserRole.TRAINER },
          select: { id: true },
        });
        if (!existing) throw new NotFoundException('Trainer not found.');

        const user = await tx.user.update({
          where: { id },
          data: {
            email: dto.email === undefined ? undefined : dto.email.trim().toLowerCase(),
            name: dto.name === undefined ? undefined : dto.name.trim(),
          },
        });
        const hasProfileChanges =
          dto.bio !== undefined ||
          dto.hourlyRateMinor !== undefined ||
          dto.currency !== undefined;
        const profile = hasProfileChanges
          ? await tx.trainerProfile.update({
              where: { userId: id },
              data: {
                bio: dto.bio === undefined ? undefined : dto.bio?.trim() || null,
                hourlyRateMinor: dto.hourlyRateMinor,
                currency: dto.currency,
              },
            })
          : await tx.trainerProfile.findUniqueOrThrow({
              where: { userId: id },
            });
        return this.toTrainerResponse(
          user, profile, user.isActive ? 'ACTIVE' : 'INACTIVE', null,
        );
      });
    } catch (error: unknown) {
      if (this.isPrismaError(error, 'P2002')) {
        throw new ConflictException('A user with this email already exists.');
      }
      if (this.isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Trainer not found.');
      }
      throw error;
    }
  }

  async updateStatus(id: string, isActive: boolean) {
    return this.prisma.$transaction(async (tx) => {
      const trainer = await tx.user.findFirst({
        where: { id, role: UserRole.TRAINER },
        select: { id: true, passwordHash: true },
      });
      if (!trainer) throw new NotFoundException('Trainer not found.');
      if (isActive && !trainer.passwordHash) {
        throw new BadRequestException('A trainer must accept their invitation before activation.');
      }
      if (!isActive) {
        await tx.trainerInvitation.updateMany({
          where: { userId: id, consumedAt: null },
          data: { consumedAt: new Date() },
        });
        await tx.authSession.deleteMany({ where: { userId: id } });
      }
      const user = await tx.user.update({ where: { id }, data: { isActive } });
      return {
        id: user.id, email: user.email, name: user.name, role: user.role,
        isActive: user.isActive, status: user.isActive ? 'ACTIVE' : 'INACTIVE',
      };
    });
  }

  async issueInvitation(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: { id: userId, role: UserRole.TRAINER },
        select: { id: true, passwordHash: true },
      });
      if (!user) throw new NotFoundException('Trainer not found.');
      if (user.passwordHash) throw new ConflictException('This trainer has already set a password.');
      await tx.trainerInvitation.updateMany({
        where: { userId, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      const invitation = await this.createInvitation(tx, userId);
      return { invitationUrl: invitation.url, invitationExpiresAt: invitation.expiresAt };
    });
  }

  async acceptInvitation(dto: AcceptTrainerInvitationDto) {
    const tokenHash = this.hashToken(dto.token);
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const now = new Date();

    const user = await this.prisma.$transaction(async (tx) => {
      const invitation = await tx.trainerInvitation.findUnique({
        where: { tokenHash },
        select: {
          id: true, userId: true, expiresAt: true, consumedAt: true,
          user: { select: { id: true, role: true, passwordHash: true } },
        },
      });
      if (
        !invitation || invitation.consumedAt || invitation.expiresAt <= now ||
        invitation.user.role !== UserRole.TRAINER || invitation.user.passwordHash
      ) {
        throw new UnauthorizedException('This invitation is invalid or has expired.');
      }

      const claimed = await tx.trainerInvitation.updateMany({
        where: { id: invitation.id, consumedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now },
      });
      if (claimed.count !== 1) {
        throw new UnauthorizedException('This invitation is invalid or has expired.');
      }

      const activated = await tx.user.updateMany({
        where: { id: invitation.userId, role: UserRole.TRAINER, passwordHash: null },
        data: { passwordHash, isActive: true },
      });
      if (activated.count !== 1) {
        throw new UnauthorizedException('This invitation is invalid or has expired.');
      }
      const updated = await tx.user.findUnique({ where: { id: invitation.userId } });
      if (!updated) throw new UnauthorizedException('This invitation is invalid or has expired.');
      return updated;
    });

    return {
      user: {
        id: user.id, email: user.email, name: user.name, role: user.role, isActive: user.isActive,
      },
    };
  }

  private async createInvitation(tx: Prisma.TransactionClient, userId: string) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITATION_DURATION_MS);
    const invitation = await tx.trainerInvitation.create({
      data: { userId, tokenHash: this.hashToken(token), expiresAt },
    });
    const baseUrl = this.config.get<string>('TRAINER_INVITATION_BASE_URL') ?? DEFAULT_INVITATION_BASE_URL;
    const url = new URL(baseUrl);
    url.searchParams.set('token', token);
    return { url: url.toString(), expiresAt: invitation.expiresAt };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toTrainerResponse(
    user: User,
    profile: { id: string; bio: string | null; hourlyRateMinor: number | null; currency: string; createdAt: Date; updatedAt: Date },
    status: 'ACTIVE' | 'INVITED' | 'INACTIVE',
    invitationExpiresAt: Date | null,
  ) {
    return {
      id: user.id, email: user.email, name: user.name, role: user.role,
      isActive: user.isActive, status, invitationExpiresAt, trainerProfile: profile,
      createdAt: user.createdAt, updatedAt: user.updatedAt,
    };
  }

  private isPrismaError(error: unknown, code: string): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
  }
}
