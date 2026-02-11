import { z } from 'zod';

const numberField = (fieldName: string, mustBePositive = true) =>
  z.preprocess((val) => {
    if (typeof val === "string" || typeof val === "number") {
      return Number(val);
    }
    return val;
  },
  mustBePositive
    ? z.number({
        required_error: `${fieldName} is required`,
        invalid_type_error: `${fieldName} must be a number`,
      }).positive(`${fieldName} must be positive`)
    : z.number({
        required_error: `${fieldName} is required`,
        invalid_type_error: `${fieldName} must be a number`,
      }).min(0, `${fieldName} cannot be negative`)
  );

const addToCartValidationSchema = z.object({
  body: z.object({
    productId: z.string({ required_error: 'Product ID is required' }),
    quantity: numberField('Quantity', true),
  }),
});

const updateCartValidationSchema = z.object({
  body: z.object({
    quantity: numberField('Quantity', true),
  }),
});

export const CartValidation = {
  addToCartValidationSchema,
  updateCartValidationSchema,
};
