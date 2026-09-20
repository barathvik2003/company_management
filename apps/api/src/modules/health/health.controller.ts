import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check(): Promise<{
    status: 'ok' | 'degraded';
    database: 'connected' | 'disconnected';
    uptimeSeconds: number;
    timestamp: string;
  }> {
    const dbUp = await this.prisma.isHealthy();
    return {
      status: dbUp ? 'ok' : 'degraded',
      database: dbUp ? 'connected' : 'disconnected',
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}
