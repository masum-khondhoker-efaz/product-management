import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { orderService } from './order.service';
import { OrderStatus } from '@prisma/client';
import { ISearchAndFilterOptions } from '../../interface/pagination.type';

const createOrder = catchAsync(async (req, res) => {
  const user = req.user as any;
  const { shippingAddress, notes } = req.body;

  const result = await orderService.createOrder(
    user.id,
    shippingAddress,
    notes,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Order placed successfully',
    data: result,
  });
});

const getMyOrders = catchAsync(async (req, res) => {
  const user = req.user as any;

  const result = await orderService.getMyOrders(
    user.id,
    req.query as ISearchAndFilterOptions,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Orders retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getAllOrders = catchAsync(async (req, res) => {
  const result = await orderService.getAllOrders(
    req.query as ISearchAndFilterOptions,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Orders retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getOrderById = catchAsync(async (req, res) => {
  const user = req.user as any;
  const result = await orderService.getOrderById(user.id, req.params.id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Order retrieved successfully',
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const result = await orderService.updateOrderStatus(
    req.params.id,
    req.body.status,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Order status updated successfully',
    data: result,
  });
});

const cancelOrder = catchAsync(async (req, res) => {
  const user = req.user as any;

  const result = await orderService.cancelOrder(
    user.id,
    req.params.id,
    req.body.reason,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Order canceled successfully',
    data: result,
  });
});

export const orderController = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
};
