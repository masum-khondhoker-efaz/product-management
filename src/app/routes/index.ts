import express from 'express';
import { UserRouters } from '../modules/user/user.routes';
import { AuthRouters } from '../modules/auth/auth.routes';
import { ProductRouters } from '../modules/product/product.routes';
import { CartRouters } from '../modules/cart/cart.routes';
import { OrderRouters } from '../modules/order/order.routes';
import { PaymentsRouters } from '../modules/payments/payments.routes';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRouters,
  },
  {
    path: '/users',
    route: UserRouters,
  },
  {
    path: '/products',
    route: ProductRouters,
  },
  {
    path: '/carts',
    route: CartRouters,
  },
  {
    path: '/orders',
    route: OrderRouters,
  },
  {
    path: '/payments',
    route: PaymentsRouters,
  },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;