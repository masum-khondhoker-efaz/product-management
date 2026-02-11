import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { cartService } from './cart.service';
import { ISearchAndFilterOptions } from '../../interface/pagination.type';

const addToCart = catchAsync(async (req, res) => {
  const user = req.user as any;
  const { productId, quantity } = req.body;

  const result = await cartService.addToCart(user.id, productId, quantity);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Product added to cart successfully',
    data: result,
  });
});

const getCart = catchAsync(async (req, res) => {
  const user = req.user as any;

  const result = await cartService.getCart(
    user.id,
    req.query as ISearchAndFilterOptions,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Cart retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const updateCartItem = catchAsync(async (req, res) => {
  const user = req.user as any;
  const { id } = req.params;
  const { quantity } = req.body;

  const result = await cartService.updateCartItem(user.id, id, quantity);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Cart item updated successfully',
    data: result,
  });
});

const removeFromCart = catchAsync(async (req, res) => {
  const user = req.user as any;
  const { id } = req.params;

  const result = await cartService.removeFromCart(user.id, id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Item removed from cart successfully',
    data: result,
  });
});

const clearCart = catchAsync(async (req, res) => {
  const user = req.user as any;

  const result = await cartService.clearCart(user.id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Cart cleared successfully',
    data: result,
  });
});

export const CartController = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
