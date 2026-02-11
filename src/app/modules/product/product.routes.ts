import express from 'express';
import { ProductController } from './product.controller';
import { ProductValidation } from './product.validation';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { UserRoleEnum } from '@prisma/client';

const router = express.Router();

router.post(
  '/',
  auth(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN),
  validateRequest(ProductValidation.createProductValidationSchema),
  ProductController.createProduct,
);

router.get('/', ProductController.getAllProducts);

router.get('/:id', ProductController.getProductById);

router.patch(
  '/:id',
  auth(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN),
  validateRequest(ProductValidation.updateProductValidationSchema),
  ProductController.updateProduct,
);

router.patch(
  '/stock/:id',
  auth(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN),
  validateRequest(ProductValidation.updateStockValidationSchema),
  ProductController.updateStock,
);

router.delete(
  '/:id',
  auth(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN),
  ProductController.deleteProduct,
);

export const ProductRouters = router;
