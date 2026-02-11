import express from 'express';
import { PaymentsController } from './payments.controller';
import { PaymentsValidation } from './payments.validation';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { UserRoleEnum } from '@prisma/client';

const router = express.Router();

// Customer routes

router.post(
  '/process',
  auth(UserRoleEnum.CUSTOMER),
  validateRequest(PaymentsValidation.processPaymentValidationSchema),
  PaymentsController.processPayment,
);


// Admin routes
router.get(
  '/',
  auth(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN),
  PaymentsController.getAllPayments,
);

export const PaymentsRouters = router;
