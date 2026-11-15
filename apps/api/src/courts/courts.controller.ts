
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { UpdateCourtStatusDto } from './dto/update-court-status.dto';
import { CourtsService } from './courts.service';
import { OperatingHoursService } from './operating-hours.service';
import { ReplaceOperatingHoursDto } from './dto/replace-operating-hours.dto';

@ApiTags('Courts')
@Controller('courts')
export class CourtsController {
  constructor(
    private readonly courtsService: CourtsService,
    private readonly operatingHoursService: OperatingHoursService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List active courts' })
  findActive() {
    return this.courtsService.findActive();
  }

  @Get('admin')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all courts (admin only)' })
  findAll() {
    return this.courtsService.findAll();
  }

  @Get(':id/operating-hours')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a court weekly operating schedule (admin only)' })
  getOperatingHours(@Param('id') id: string) {
    return this.operatingHoursService.findForCourt(id);
  }

  @Put(':id/operating-hours')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Replace a court weekly operating schedule (admin only)' })
  replaceOperatingHours(
    @Param('id') id: string,
    @Body() dto: ReplaceOperatingHoursDto,
  ) {
    return this.operatingHoursService.replaceForCourt(id, dto);
  }

  @Post()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a court (admin only)' })
  create(@Body() dto: CreateCourtDto) {
    return this.courtsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update court details (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateCourtDto) {
    return this.courtsService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate or deactivate a court (admin only)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCourtStatusDto,
  ) {
    return this.courtsService.updateStatus(id, dto.isActive);
  }
}
