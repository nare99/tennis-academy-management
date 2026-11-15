import {
  Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { AcceptTrainerInvitationDto } from './dto/accept-trainer-invitation.dto';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { UpdateTrainerStatusDto } from './dto/update-trainer-status.dto';
import { TrainersService } from './trainers.service';

@ApiTags('Trainers')
@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Get('admin')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List trainers (admin only)' })
  findAll() {
    return this.trainersService.findAll();
  }

  @Post()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a trainer and issue an invitation (admin only)' })
  create(@Body() dto: CreateTrainerDto) {
    return this.trainersService.create(dto);
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update trainer details (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateTrainerDto) {
    return this.trainersService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate or deactivate a trainer (admin only)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTrainerStatusDto) {
    return this.trainersService.updateStatus(id, dto.isActive);
  }

  @Post(':id/invitation')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reissue an invitation for a trainer without a password' })
  issueInvitation(@Param('id') id: string) {
    return this.trainersService.issueInvitation(id);
  }

  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept invitation and set trainer password' })
  acceptInvitation(@Body() dto: AcceptTrainerInvitationDto) {
    return this.trainersService.acceptInvitation(dto);
  }
}
