import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { paymentsService } from './payments.service';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { ISearchAndFilterOptions } from '../../interface/pagination.type';


const processPayment = catchAsync(async (req, res) => {
  const user = req.user as any;
  const { orderId, paymentMethod, ...paymentDetails } = req.body;

  const result = await paymentsService.processPayment(
    user.id,
    orderId,
    paymentMethod,
    paymentDetails,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: result.payment,
  });
});

const getAllPayments = catchAsync(async (req, res) => {


  const result = await paymentsService.getAllPayments(req.query as ISearchAndFilterOptions);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Payments retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});


export const PaymentsController = {
  processPayment,
  getAllPayments,
};
