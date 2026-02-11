import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';
import { ISearchAndFilterOptions } from '../../interface/pagination.type';

const addToCart = async (
  userId: string,
  productId: string,
  quantity: number,
) => {
  // Check if product exists and has enough stock
  const product = await prisma.product.findUnique({
    where: { id: productId, isDeleted: false },
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  if (product.stock < quantity) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Only ${product.stock} items available in stock`,
    );
  }

  // Check if item already exists in cart
  const existingCartItem = await prisma.cart.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  let cartItem;

  if (existingCartItem) {
    const newQuantity = existingCartItem.quantity + quantity;

    if (product.stock < newQuantity) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Only ${product.stock} items available in stock`,
      );
    }

    cartItem = await prisma.cart.update({
      where: { id: existingCartItem.id },
      data: { quantity: newQuantity },
      include: { product: true },
    });
  } else {
    cartItem = await prisma.cart.create({
      data: {
        userId,
        productId,
        quantity,
      },
      include: { product: true },
    });
  }

  return cartItem;
};

const getCart = async (userId: string, options: ISearchAndFilterOptions) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const skip = (page - 1) * limit;

  const whereCondition: any = {
    userId,
    product: {
      isDeleted: false,
      ...(searchTerm && {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      }),
    },
  };

  const [cartItems, total] = await Promise.all([
    prisma.cart.findMany({
      where: whereCondition,
      include: { product: true },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.cart.count({ where: whereCondition }),
  ]);

  const response = cartItems.map(item => ({
    cartId: item.id,
    productId: item.productId,
    name: item.product.name,
    description: item.product.description,
    price: item.product.price,
    quantity: item.quantity,
    subTotal: item.product.price * item.quantity,
  }));

  const totalAmount = response.reduce(
    (sum, item) => sum + item.subTotal,
    0
  );

  return {
    data: response,
    totalAmount,
    totalItems: response.length,
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


const updateCartItem = async (
  userId: string,
  cartItemId: string,
  quantity: number,
) => {
  const cartItem = await prisma.cart.findUnique({
    where: { id: cartItemId },
    include: { product: true },
  });

  if (!cartItem) {
    throw new AppError(httpStatus.NOT_FOUND, 'Cart item not found');
  }

  if (cartItem.userId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to update this cart item',
    );
  }

  if (cartItem.product.stock < quantity) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Only ${cartItem.product.stock} items available in stock`,
    );
  }

  const updatedCartItem = await prisma.cart.update({
    where: { id: cartItemId },
    data: { quantity },
    include: { product: true },
  });
  if (!updatedCartItem) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to update cart item',
    );
  }

  return updatedCartItem;
};

const removeFromCart = async (userId: string, cartItemId: string) => {
  const cartItem = await prisma.cart.findUnique({
    where: { id: cartItemId },
  });

  if (!cartItem) {
    throw new AppError(httpStatus.NOT_FOUND, 'Cart item not found');
  }

  if (cartItem.userId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to remove this cart item',
    );
  }

  const deleteFromCart = await prisma.cart.delete({
    where: { id: cartItemId },
  });
  if (!deleteFromCart) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to remove item from cart',
    );
  }

  return { message: 'Item removed from cart successfully' };
};

const clearCart = async (userId: string) => {
  const deletedItems = await prisma.cart.deleteMany({
    where: { userId },
  });
  if (deletedItems.count === 0) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to clear cart or cart is already empty',
    );
  }

  return { message: 'Cart cleared successfully' };
};

export const cartService = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
