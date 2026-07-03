import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaymentMethod } from '../generated/prisma';

@Injectable()
export class OrderService {
  constructor(private readonly prismaService: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prismaService.product.findMany({
      where: { id: { in: productIds }, status: 'ACTIVE' },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products are unavailable');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const orderItems = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product)
        throw new BadRequestException(
          `Product ${item.productId} is unavailable`,
        );
      const price = product.discountPrice ?? product.price;
      subtotal += price * item.quantity;

      const images = product.images as string[];
      const firstImage =
        Array.isArray(images) && images.length > 0 ? images[0] : null;

      return {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        image: firstImage,
        price,
        quantity: item.quantity,
      };
    });

    const order = await this.prismaService.order.create({
      data: {
        userId,
        paymentMethod: dto.paymentMethod as PaymentMethod,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        secondPhone: dto.secondPhone ?? null,
        address: dto.address,
        city: dto.city,
        postalCode: dto.postalCode,
        subtotal,
        total: subtotal,
        items: { create: orderItems },
      },
      include: { items: true },
    });

    return order;
  }

  async getUserOrders(userId: string) {
    return this.prismaService.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.prismaService.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getAllOrders() {
    return this.prismaService.order.findMany({
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prismaService.order.update({
      where: { id: orderId },
      data: { status: status as any },
      include: { items: true },
    });
  }
}
