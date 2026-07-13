import { Controller, Post, Get, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User, Role, OrderStatus } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Body() orderDto: any, @GetUser() user: User) {
    return this.ordersService.createOrder(user.id, orderDto);
  }

  @Get('my')
  async getMyOrders(@GetUser() user: User) {
    return this.ordersService.getMyOrders(user.id);
  }

  @Get('admin')
  async getAllOrders(@GetUser() user: User) {
    if (user.role !== Role.TRADER && user.role !== Role.ADMIN_KYC) {
      throw new ForbiddenException("Accès réservé aux administrateurs.");
    }
    return this.ordersService.getAllOrders();
  }

  @Post('admin/status/:id')
  async updateStatus(
    @Param('id') orderId: string,
    @Body('status') status: OrderStatus,
    @Body('priceReal') priceReal: number | null,
    @GetUser() user: User,
  ) {
    if (user.role !== Role.TRADER && user.role !== Role.ADMIN_KYC) {
      throw new ForbiddenException("Accès réservé aux administrateurs.");
    }
    return this.ordersService.updateOrderStatus(orderId, status, priceReal);
  }
}
