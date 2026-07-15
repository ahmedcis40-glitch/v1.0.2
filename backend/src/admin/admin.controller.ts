import { Controller, Get, Patch, Param, Body, UseGuards, Post } from '@nestjs/common';
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

  @Post('users/:id/documents')
  async uploadDocument(
    @Param('id') userId: string,
    @Body('title') title: string,
    @Body('fileName') fileName: string,
    @Body('fileData') fileData: string,
  ) {
    return this.adminService.uploadDocument(userId, title, fileName, fileData);
  }

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
