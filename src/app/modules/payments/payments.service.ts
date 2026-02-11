import { Response } from 'express';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import { ISearchAndFilterOptions } from '../../interface/pagination.type';

// Simulate payment processing (replace with actual payment gateway)
const simulatePaymentProcessing = async (
  paymentMethod: PaymentMethod,
  amount: number,
  paymentDetails?: any,
): Promise<{ success: boolean; transactionId: string; message: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate mock transaction ID
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Simulate payment scenarios
  if (paymentMethod === PaymentMethod.CASH_ON_DELIVERY) {
    return {
      success: true,
      transactionId,
      message: 'Cash on delivery order confirmed',
    };
  }

  // Simulate card/mobile payment (90% success rate in simulation)
  const isSuccess = Math.random() > 0.1;

  if (isSuccess) {
    return {
      success: true,
      transactionId,
      message: 'Payment processed successfully',
    };
  } else {
    return {
      success: false,
      transactionId: '',
      message:
        'Payment failed. Please try again or use a different payment method.',
    };
  }
};

const processPayment = async (
  userId: string,
  orderId: string,
  paymentMethod: PaymentMethod,
  paymentDetails?: any,
) => {
  // Check if order exists and belongs to user
  const order = await prisma.order.findUnique({
    where: { id: orderId, userId },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  if (order.status === OrderStatus.CANCELED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot process payment for canceled order',
    );
  }

  // Check existing payment
  let payment = await prisma.payment.findUnique({
    where: { orderId },
  });

  if (payment && payment.status === PaymentStatus.COMPLETED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Payment already completed for this order',
    );
  }

  // Process payment (simulate payment gateway)
  const paymentResult = await simulatePaymentProcessing(
    paymentMethod,
    order.totalAmount,
    paymentDetails,
  );

  if (!paymentResult.success) {
    // Update or create payment with failed status
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          paymentMethod,
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId,
          userId,
          amount: order.totalAmount,
          paymentMethod,
          status: PaymentStatus.FAILED,
        },
      });
    }
    throw new AppError(httpStatus.PAYMENT_REQUIRED, paymentResult.message);
  }

  // Update or create payment with success
  const result = await prisma.$transaction(async tx => {
    let updatedPayment;

    if (payment) {
      updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          paymentMethod,
          transactionId: paymentResult.transactionId,
          paidAt: new Date(),
        },
        include: {
          order: true,
        },
      });
    } else {
      updatedPayment = await tx.payment.create({
        data: {
          orderId,
          userId,
          amount: order.totalAmount,
          paymentMethod,
          transactionId: paymentResult.transactionId,
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
        },
        include: {
          order: true,
        },
      });
    }

    // Update order payment status and status
    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.COMPLETED,
        status:
          paymentMethod === PaymentMethod.CASH_ON_DELIVERY
            ? OrderStatus.PENDING
            : OrderStatus.CONFIRMED,
      },
    });

    return updatedPayment;
  });

  return {
    payment: result,
    message: paymentResult.message,
  };
};

const getAllPayments = async (options: ISearchAndFilterOptions) => {
const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;
  
  if(sortBy && !['createdAt', 'amount', 'status'].includes(sortBy)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid sortBy field');
  }

  if(sortOrder && !['asc', 'desc'].includes(sortOrder)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid sortOrder value');
  }

  const where: any = {};

  if (searchTerm) {
    where.OR = [
      { transactionId: { contains: searchTerm, mode: 'insensitive' } },
      { user: { fullName: { contains: searchTerm, mode: 'insensitive' } } },
      { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
    ];
  }

  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
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
        order: {
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.payment.count({ where }),
  ]);

  const response = payments.map(payment => ({
    id: payment.id,
    orderId: payment.orderId,
    user: payment.user,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    paymentStatus: payment.status,
    transactionId: payment.transactionId,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
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

export const paymentsService = {
  processPayment,
  getAllPayments,
};
