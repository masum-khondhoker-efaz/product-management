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

const createProductValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Product name is required" }),
    description: z.string().optional(),
    price: numberField("Price", true),
    stock: numberField("Stock", false),
    category: z.string().optional(),
    image: z.string().optional(),
  }),
});

const updateProductValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: numberField("Price", true).optional(),
    stock: numberField("Stock", false).optional(),
    category: z.string().optional(),
    image: z.string().optional(),
  }),
});

const updateStockValidationSchema = z.object({
  body: z.object({
    stock: z
      .number({ required_error: 'Stock is required' })
      .int()
      .nonnegative('Stock cannot be negative'),
  }),
});

export const ProductValidation = {
  createProductValidationSchema,
  updateProductValidationSchema,
  updateStockValidationSchema,
};
