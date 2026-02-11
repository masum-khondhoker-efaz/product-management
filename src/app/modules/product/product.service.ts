import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';
import { Product } from '@prisma/client';
import { ISearchAndFilterOptions } from '../../interface/pagination.type';
import { calculatePagination } from '../../utils/calculatePagination';
import { buildNumericRangeQuery } from '../../utils/searchFilter';

const createProduct = async (
  userId: string,
  payload: {
    name: string;
    description?: string;
    price: number;
    stock: number;
    category?: string;
    image?: string;
  },
) => {
  // check the product name already exists or not
  const existingProduct = await prisma.product.findFirst({
    where: {
      name: payload.name,
      isDeleted: false,
    },
  });

  if (existingProduct) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Product with this name already exists',
    );
  }

  const product = await prisma.product.create({
    data: {
      userId,
      ...payload,
    },
  });
  if (!product) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create product',
    );
  }

  return product;
};

const getAllProducts = async (options: ISearchAndFilterOptions) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);
  const { searchTerm, name, category,stockMin, stockMax, priceMin, priceMax, isActive } = options;

  const where: any = {
    isDeleted: false,
  };

  // Search in name and description
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  // Filter by name
  if (name) {
    where.name = { contains: name, mode: 'insensitive' };
  }

  // Filter by category
  if (category) {
    where.category = { contains: category, mode: 'insensitive' };
  }

  // Filter by price range
  if (priceMin !== undefined || priceMax !== undefined) {
    where.price = {};
    if (priceMin !== undefined) where.price.gte = Number(priceMin);
    if (priceMax !== undefined) where.price.lte = Number(priceMax);
  }

  //filter by stock
if(stockMin !== undefined || stockMax !== undefined){
  where.stock = {};
  if(stockMin !== undefined) where.stock.gte = Number(stockMin);
  if(stockMax !== undefined) where.stock.lte = Number(stockMax);
}

  // Filter by active status
  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: products,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

const getProductById = async (id: string): Promise<Product> => {
  const product = await prisma.product.findUnique({
    where: { id, isDeleted: false },
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  return product;
};

const updateProduct = async (
  id: string,
  payload: {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    category?: string;
    image?: string;
  },
) => {
  const product = await prisma.product.findUnique({
    where: { id, isDeleted: false },
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  if (!payload || Object.keys(payload).length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No update fields provided');
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: payload,
  });

  return updatedProduct;
};

const updateStock = async (id: string, stock: number) => {
  const product = await prisma.product.findUnique({
    where: { id, isDeleted: false },
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: { stock },
  });
  if (!updatedProduct) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to update product stock',
    );
  }

  return updatedProduct;
};

const deleteProduct = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id, isDeleted: false },
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  const deletedProduct = await prisma.product.update({
    where: { id },
    data: { isDeleted: true },
  });
  if (!deletedProduct) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to delete product',
    );
  }

  return deletedProduct;
};

export const ProductService = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  updateStock,
  deleteProduct,
};
