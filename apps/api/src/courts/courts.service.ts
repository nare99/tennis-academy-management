
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Court, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';

@Injectable()
export class CourtsService {
  constructor(private readonly prisma: PrismaService) {}

  findActive(): Promise<Court[]> {
    return this.prisma.court.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  findAll(): Promise<Court[]> {
    return this.prisma.court.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateCourtDto): Promise<Court> {
    try {
      return await this.prisma.court.create({
        data: {
          name: dto.name.trim(),
          surface: dto.surface?.trim() || null,
          isIndoor: dto.isIndoor ?? false,
        },
      });
    } catch (error: unknown) {
      if (this.isPrismaError(error, 'P2002')) {
        throw new ConflictException(
          'A court with this name already exists.',
        );
      }

      throw error;
    }
  }

  async update(id: string, dto: UpdateCourtDto): Promise<Court> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Provide at least one court field to update.',
      );
    }

    try {
      return await this.prisma.court.update({
        where: { id },
        data: {
          name: dto.name === undefined ? undefined : dto.name.trim(),
          surface:
            dto.surface === undefined
              ? undefined
              : dto.surface?.trim() || null,
          isIndoor: dto.isIndoor,
        },
      });
    } catch (error: unknown) {
      if (this.isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Court not found.');
      }

      if (this.isPrismaError(error, 'P2002')) {
        throw new ConflictException(
          'A court with this name already exists.',
        );
      }

      throw error;
    }
  }

  async updateStatus(id: string, isActive: boolean): Promise<Court> {
    try {
      return await this.prisma.court.update({
        where: { id },
        data: { isActive },
      });
    } catch (error: unknown) {
      if (this.isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Court not found.');
      }

      throw error;
    }
  }

  private isPrismaError(
    error: unknown,
    code: string,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === code
    );
  }
}
