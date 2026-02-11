import { z } from 'zod';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

const updatePaymentStatusValidationSchema = z.object({
  body: z.object({
    status: z.nativeEnum(PaymentStatus, {
      required_error: 'Payment status is required',
    }),
    transactionId: z.string().optional(),
  }),
});

const processPaymentValidationSchema = z.object({
  body: z.object({
    orderId: z.string({ required_error: 'Order ID is required' }),
    paymentMethod: z.nativeEnum(PaymentMethod, {
      required_error: 'Payment method is required',
    }),
  }),
});

export const PaymentsValidation = {
  updatePaymentStatusValidationSchema,
  processPaymentValidationSchema,
};
