import express from 'express';
import { orderController } from './order.controller';
import { orderValidation } from './order.validation';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { UserRoleEnum } from '@prisma/client';

const router = express.Router();

// Customer routes
router.post(
  '/',
  auth(UserRoleEnum.CUSTOMER),
  validateRequest(orderValidation.createOrderValidationSchema),
  orderController.createOrder,
);

// Admin routes
router.get(
  '/',
  auth(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN),
  orderController.getAllOrders,
);

router.get(
  '/my-orders',
  auth(UserRoleEnum.CUSTOMER),
  orderController.getMyOrders,
);

router.get(
  '/:id',
  auth(UserRoleEnum.CUSTOMER, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN),
  orderController.getOrderById,
);

router.patch(
  '/cancel/:id',
  auth(UserRoleEnum.CUSTOMER),
  validateRequest(orderValidation.cancelOrderValidationSchema),
  orderController.cancelOrder,
);



router.patch(
  '/status/:id',
  auth(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN),
  validateRequest(orderValidation.updateOrderStatusValidationSchema),
  orderController.updateOrderStatus,
);

export const OrderRouters = router;
