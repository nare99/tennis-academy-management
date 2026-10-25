import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'API process is healthy' })
  getHealth() {
    return {
      status: 'ok',
      service: 'tennis-academy-api',
      timestamp: new Date().toISOString(),
    };
  }
}
