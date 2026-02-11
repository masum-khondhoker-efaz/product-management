import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { ISearchAndFilterOptions } from '../../interface/pagination.type';

const FRAUD_THRESHOLD = 3;

const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  console.log('Generated order number:', `ORD-${timestamp}-${random}`);
  return `ORD-${timestamp}-${random}`;
};

const createOrder = async (
  userId: string,
  shippingAddress: string,
  notes?: string,
) => {
  // Check user fraud score
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.canceledOrdersCount >= FRAUD_THRESHOLD) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your account has been flagged due to excessive order cancellations. Please contact support.',
    );
  }

  // Get cart items
  const cartItems = await prisma.cart.findMany({
    where: { userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Cart is empty');
  }

  // Validate stock availability and calculate total
  let totalAmount = 0;
  const orderItems: Array<{
    productId: string;
    quantity: number;
    price: number;
    subtotal: number;
  }> = [];

  for (const item of cartItems) {
    if (item.product.isDeleted) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Product ${item.product.name} is no longer available`,
      );
    }

    if (item.product.stock < item.quantity) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Insufficient stock for ${item.product.name}. Only ${item.product.stock} available.`,
      );
    }

    const subtotal = item.product.price * item.quantity;
    totalAmount += subtotal;

    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      price: item.product.price,
      subtotal,
    });
  }

  // Create order with transaction
  const result = await prisma.$transaction(async tx => {
    // Create order
    const order = await tx.order.create({
      data: {
        userId,
        orderNumber: generateOrderNumber(),
        totalAmount,
        shippingAddress,
        notes,
        status: OrderStatus.PENDING,
      },
    });

    // Create order items and update product stock
    for (const item of orderItems) {
      await tx.orderItem.create({
        data: {
          userId,
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        },
      });

      // Deduct stock
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Clear cart
    await tx.cart.deleteMany({
      where: { userId },
    });

    // Fetch complete order with relations
    return tx.order.findUnique({
      where: { id: order.id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
  });

  return result;
};

const getMyOrders = async (
  userId: string,
  options: ISearchAndFilterOptions,
) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const skip = (page - 1) * limit;

  // Build where condition for product search
  const where: any = {
    userId,
  };

  if (searchTerm) {
    where.OR = [
      {
        orderNumber: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      {
        orderItems: {
          some: {
            product: {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
        },
      },
    ];
  } else {
    where.userId = userId;

    if (options.status) {
      where.status = options.status;
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        payment: true,
      },
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.order.count({ where }),
  ]);

  const response = orders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    shippingAddress: order.shippingAddress,
    notes: order.notes,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.orderItems.map(item => ({
      productId: item.productId,
      name: item.product.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
    paymentStatus: order.payment ? order.payment.status : PaymentStatus.PENDING,
  }));

  return {
    data: response,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

const getAllOrders = async (options: ISearchAndFilterOptions) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const skip = (page - 1) * limit;

  const where: any = {};

  if (searchTerm) {
    where.OR = [
      {
        orderNumber: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      {
        orderItems: {
          some: {
            product: {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
        },
      },
    ];
  }

  if (options.status) {
    where.status = options.status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
        payment: true,
      },
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.order.count({ where }),
  ]);

  const response = orders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    shippingAddress: order.shippingAddress,
    notes: order.notes,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    user: {
      id: order.user.id,
      fullName: order.user.fullName,
      email: order.user.email,
    },
    items: order.orderItems.map(item => ({
      productId: item.productId,
      name: item.product.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
    paymentStatus: order.payment ? order.payment.status : PaymentStatus.PENDING,
  }));  

  return {
    data: response,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

const getOrderById = async (userId: string, orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId, userId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      orderItems: {
        include: {
          product: true,
        },
      },
      payment: true,
    },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  // Check if user is authorized to view this order
  if (userId && order.userId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to view this order',
    );
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    shippingAddress: order.shippingAddress,
    notes: order.notes,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.orderItems.map(item => ({
      productId: item.productId,
      name: item.product.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
    paymentStatus: order.payment ? order.payment.status : PaymentStatus.PENDING,
  };
};

const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  if (order.status === OrderStatus.CANCELED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot update status of canceled order',
    );
  }

  if (order.status === OrderStatus.DELIVERED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot update status of delivered order',
    );
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });
  if (!updatedOrder) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to update order status',
    );
  }

  return updatedOrder;
};

const cancelOrder = async (
  userId: string,
  orderId: string,
  cancelReason: string,
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId, userId },
    include: {
      orderItems: true,
    },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  if (order.status === OrderStatus.CANCELED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Order is already canceled');
  }

  if (order.status === OrderStatus.DELIVERED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Cannot cancel delivered order');
  }

  if (order.status === OrderStatus.SHIPPED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot cancel shipped order. Please contact support.',
    );
  }

  const result = await prisma.$transaction(async tx => {
    // Restore product stock
    for (const item of order.orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    const canceledOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELED,
        canceledAt: new Date(),
        cancelReason,
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        canceledOrdersCount: {
          increment: 1,
        },
      },
    });

    return canceledOrder;
  });

  return result;
};

export const orderService = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
};
