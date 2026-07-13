import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getLogs() {
    return this.supportService.getLogs();
  }

  @Post('logs')
  async createLog(
    @Body('level') level: string,
    @Body('message') message: string,
    @Body('stack') stack?: string,
    @Body('context') context?: string,
  ) {
    return this.supportService.createLog(level, message, stack, context);
  }
}
