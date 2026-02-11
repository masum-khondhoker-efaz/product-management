import * as bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import AppError from '../../errors/AppError';
import { generateToken, refreshToken } from '../../utils/generateToken';
import prisma from '../../utils/prisma';
import { verifyToken } from '../../utils/verifyToken';
import { UserRoleEnum, UserStatus } from '@prisma/client';
import { expireToken } from '../../utils/expireToekn';

const loginUserFromDB = async (payload: {
  email: string;
  password: string;
}) => {
  // 1. Try to find a user directly
  let user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // 3. Validate password for normal users
  if (!user.password) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Password is not set');
  }

  const validPassword = await bcrypt.compare(payload.password, user.password);
  if (!validPassword) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Password incorrect');
  }

  // 5. Account status checks
  if (user.status === UserStatus.PENDING || user.isVerified === false) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Please verify your email before logging in',
    );
  }
  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your account is blocked. Please contact support.',
    );
  }

  // 6. Mark user as logged in
  if (user.isLoggedIn === false) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isLoggedIn: true },
    });
  }

  // 7. Issue tokens
  const accessToken = await generateToken(
    { id: user.id, email: user.email, role: user.role, purpose: 'access' },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  const refreshTokenValue = await refreshToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string,
  );

  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: user.role,
    image: user.image,
    accessToken,
    refreshToken: refreshTokenValue,
  };
};

const refreshTokenFromDB = async (refreshedToken: string) => {
  if (!refreshedToken) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Refresh token is required');
  }

  const decoded = await verifyToken(
    refreshedToken,
    config.jwt.refresh_secret as Secret,
  );
  if (!decoded) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }

  const userData = await prisma.user.findUnique({
    where: {
      id: (decoded as any).id,
      status: UserStatus.ACTIVE,
    },
  });

  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const newAccessToken = await generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      purpose: 'access',
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  const newRefreshToken = await refreshToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string,
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const logoutUserFromDB = async (
  userId: string,
  token: string,
  refreshToken: string,
) => {
  await prisma.user.update({
    where: { id: userId },
    data: { isLoggedIn: false },
  });
  // Optionally, you can also invalidate refresh and access tokens in a real implementation
  const check = await verifyToken(token, config.jwt.access_secret as Secret);
  if (!check) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid access token');
  }
  const refreshTokenCheck = await verifyToken(
    refreshToken,
    config.jwt.refresh_secret as Secret,
  );
  if (!refreshTokenCheck) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }

  const expiredAccessToken = await expireToken(
    token,
    config.jwt.access_secret as Secret,
  );
  const expiredRefreshToken = await expireToken(
    refreshToken,
    config.jwt.refresh_secret as Secret,
  );

  return {
    role: (check as any).role,
    accessToken: expiredAccessToken,
    refreshToken: expiredRefreshToken,
  };
};
export const AuthServices = {
  loginUserFromDB,
  logoutUserFromDB,
  refreshTokenFromDB,
};
