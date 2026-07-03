import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '../generated/prisma';

class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(user.userId, dto);
  }

  @Get('my')
  getUserOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.orderService.getUserOrders(user.userId);
  }

  @Get('admin/all')
  @UseGuards(AdminGuard)
  getAllOrders() {
    return this.orderService.getAllOrders();
  }

  @Get(':id')
  getOrderById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') orderId: string,
  ) {
    return this.orderService.getOrderById(user.userId, orderId);
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  updateOrderStatus(
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(orderId, dto.status);
  }
}
