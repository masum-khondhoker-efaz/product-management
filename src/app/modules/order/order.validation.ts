import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

const createOrderValidationSchema = z.object({
  body: z.object({
    shippingAddress: z.string({
      required_error: 'Shipping address is required',
    }),
    notes: z.string().optional(),
  }),
});

const updateOrderStatusValidationSchema = z.object({
  body: z.object({
    status: z.nativeEnum(OrderStatus, { required_error: 'Status is required' }),
  }),
});

const cancelOrderValidationSchema = z.object({
  body: z.object({
    cancelReason: z.string({ required_error: 'Cancel reason is required' }),
  }),
});

export const orderValidation = {
  createOrderValidationSchema,
  updateOrderStatusValidationSchema,
  cancelOrderValidationSchema,
};
