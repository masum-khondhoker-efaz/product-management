import express from 'express';
import { CartController } from './cart.controller';
import { CartValidation } from './cart.validation';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { UserRoleEnum } from '@prisma/client';

const router = express.Router();

router.post(
  '/',
  auth(UserRoleEnum.CUSTOMER),
  validateRequest(CartValidation.addToCartValidationSchema),
  CartController.addToCart,
);

router.get('/', auth(UserRoleEnum.CUSTOMER), CartController.getCart);

router.patch(
  '/:id',
  auth(UserRoleEnum.CUSTOMER),
  validateRequest(CartValidation.updateCartValidationSchema),
  CartController.updateCartItem,
);

router.delete(
  '/:id',
  auth(UserRoleEnum.CUSTOMER),
  CartController.removeFromCart,
);

router.delete('/', auth(UserRoleEnum.CUSTOMER), CartController.clearCart);

export const CartRouters = router;
