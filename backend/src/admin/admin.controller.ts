import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, KYCStatus, OrderStatus } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id/kyc')
  async updateKycStatus(
    @Param('id') userId: string,
    @Body('kycStatus') kycStatus: KYCStatus,
  ) {
    return this.adminService.updateKycStatus(userId, kycStatus);
  }

  @Get('transactions')
  async getTransactions() {
    return this.adminService.getTransactions();
  }

  @Get('incidents')
  async getIncidents() {
    return this.adminService.getIncidents();
  }

  @Get('reporting')
  async getReporting() {
    return this.adminService.getReporting();
  }

  @Get('orders')
  async getOrders() {
    return this.adminService.getOrders();
  }

  @Patch('orders/:id/process')
  async processOrder(
    @Param('id') orderId: string,
    @Body('status') status: OrderStatus,
    @Body('priceReal') priceReal?: number,
  ) {
    return this.adminService.processOrder(orderId, status, priceReal || null);
  }
}
