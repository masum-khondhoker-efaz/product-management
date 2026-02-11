import { UserStatus, UserRoleEnum } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import AppError from '../../errors/AppError';
import emailSender from '../../utils/emailSender';
import { generateToken, refreshToken } from '../../utils/generateToken';
import prisma from '../../utils/prisma';
import generateOtpToken from '../../utils/generateOtpToken';
import verifyOtp from '../../utils/verifyOtp';
import { emailTemplates } from '../../utils/emailTemplate';

const sendVerificationEmail = async (
  fullName: string,
  email: string,
  otp: number,
) => {
  await emailSender(
    'Verify Your Email',
    email,
    emailTemplates.getVerificationEmailTemplate(fullName, otp),
  );
};

const sendForgotPasswordEmail = async (
  fullName: string,
  email: string,
  otp: number,
) => {
  await emailSender(
    'Reset Your Password',
    email,
    emailTemplates.forgetPasswordEmailTemplate(fullName, otp),
  );
};

const registerUserIntoDB = async (payload: {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role?: UserRoleEnum;
}) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser?.isDeleted) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'You cannot register with this email. Please contact support.',
    );
  }

  if (existingUser) {
    if (existingUser.isVerified === false) {
      const { otp, otpToken } = generateOtpToken(payload.email);
      const hashedPassword = await bcrypt.hash(payload.password, 12);

      await sendVerificationEmail(
        existingUser.fullName,
        existingUser.email,
        otp,
      );
      await prisma.user.update({
        where: { email: payload.email },
        data: {
          fullName: payload.fullName,
          password: hashedPassword,
          phoneNumber: payload.phoneNumber,
        },
      });

      return otpToken;
    }
    throw new AppError(httpStatus.CONFLICT, 'User already exists!');
  }

  const hashedPassword = await bcrypt.hash(payload.password, 12);
  const { otp, otpToken } = generateOtpToken(payload.email);

  try {
    await prisma.$transaction(async tx => {
      const createdUser = await tx.user.create({
        data: {
          fullName: payload.fullName,
          email: payload.email,
          password: hashedPassword,
          phoneNumber: payload.phoneNumber,
          status: UserStatus.PENDING,
          role: UserRoleEnum.CUSTOMER,
          isVerified: false,
        },
      });

      if (!createdUser) {
        throw new AppError(httpStatus.BAD_REQUEST, 'User not created!');
      }

      await sendVerificationEmail(createdUser.fullName, createdUser.email, otp);
    });

    return otpToken;
  } catch (error) {
    throw error;
  }
};

const resendUserVerificationEmail = async (email: string) => {
  const userData = await prisma.user.findUnique({
    where: { email },
  });

  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  if (!userData.email) {
    throw new AppError(httpStatus.CONFLICT, 'Email not set for this user');
  }

  const { otp, otpToken } = generateOtpToken(userData.email);

  await emailSender(
    'Verify Your Email',
    email,
    emailTemplates.getVerificationEmailTemplate(userData.fullName, otp),
  );

  return otpToken;
};

const getMyProfileFromDB = async (id: string) => {
  const Profile = await prisma.user.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      address: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!Profile) {
    throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
  }

  return Profile;
};

const getMyProfileForSellerFromDB = async (id: string) => {
  const Profile = await prisma.user.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
    },
  });
  if (!Profile) {
    throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
  }

  return {
    id: Profile.id,
  };
};

const updateMyProfileIntoDB = async (id: string, payload: any) => {
  const userData = payload;

  await prisma.$transaction(async (transactionClient: any) => {
    const updatedUser = await transactionClient.user.update({
      where: { id },
      data: userData,
    });

    return { updatedUser };
  });

  const updatedUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      address: true,
    },
  });
  if (!updatedUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found after update');
  }

  return updatedUser;
};

const changePassword = async (
  user: any,
  userId: string,
  payload: {
    oldPassword: string;
    newPassword: string;
  },
) => {
  const userData = await prisma.user.findUnique({
    where: {
      id: userId,
      email: user.email,
      status: UserStatus.ACTIVE,
    },
  });
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (userData.password === null) {
    throw new AppError(httpStatus.CONFLICT, 'Password not set for this user');
  }

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.oldPassword,
    userData.password,
  );

  if (!isCorrectPassword) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Incorrect old password');
  }

  const newPasswordSameAsOld: boolean = await bcrypt.compare(
    payload.newPassword,
    userData.password,
  );

  if (newPasswordSameAsOld) {
    throw new AppError(
      httpStatus.CONFLICT,
      'New password must be different from the old password',
    );
  }

  const hashedPassword: string = await bcrypt.hash(payload.newPassword, 12);

  await prisma.user.update({
    where: {
      id: userData.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: 'Password changed successfully!',
  };
};

const forgotPassword = async (payload: { email: string }) => {
  const userData = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  if (!userData.email) {
    throw new AppError(httpStatus.CONFLICT, 'Email not set for this user');
  }

  const { otp, otpToken } = generateOtpToken(userData.email);

  sendForgotPasswordEmail(userData.fullName, userData.email, otp);

  return otpToken;
};

const resendOtpIntoDB = async (payload: { email: string }) => {
  const userData = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  if (!userData.email) {
    throw new AppError(httpStatus.CONFLICT, 'Email not set for this user');
  }

  const { otp, otpToken } = generateOtpToken(userData.email);

  sendForgotPasswordEmail(userData.fullName, userData.email, otp);

  return otpToken;
};

const verifyOtpInDB = async (bodyData: {
  email: string;
  otp: number;
  otpToken: string;
}) => {
  const userData = await prisma.user.findUnique({
    where: { email: bodyData.email },
  });

  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  const isValid = verifyOtp(bodyData.email, bodyData.otp, bodyData.otpToken);
  if (!isValid) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP!');
  }

  const updatedUser = await prisma.user.update({
    where: { email: bodyData.email },
    data: {
      status: UserStatus.ACTIVE,
      isVerified: true,
      isProfileComplete: true,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      image: true,
    },
  });

  const accessToken = await generateToken(
    {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      purpose: 'access',
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  const refreshTokenValue = await refreshToken(
    { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string,
  );

  return {
    id: updatedUser.id,
    name: updatedUser.fullName,
    email: updatedUser.email,
    image: updatedUser.image,
    role: updatedUser.role,
    accessToken: accessToken,
    refreshToken: refreshTokenValue,
  };
};

const verifyOtpForgotPasswordInDB = async (payload: {
  email: string;
  otp: number;
  otpToken: string;
}) => {
  const userData = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  const isValid = verifyOtp(payload.email, payload.otp, payload.otpToken);
  if (!isValid) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP!');
  }

  await prisma.user.update({
    where: { email: payload.email },
    data: {
      isVerifiedForPasswordReset: true,
    },
  });

  return;
};

const updatePasswordIntoDb = async (payload: any) => {
  const userData = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }
  const isValid = verifyOtp(payload.email, payload.otp, payload.otpToken);
  if (!isValid) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP!');
  }

  if (userData.isVerifiedForPasswordReset !== true) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'OTP verification required before updating password.',
    );
  }

  const hashedPassword: string = await bcrypt.hash(payload.password, 12);
  await prisma.user.update({
    where: { email: payload.email },
    data: {
      password: hashedPassword,
      isVerifiedForPasswordReset: false,
    },
  });

  return {
    message: 'Password updated successfully!',
  };
};

const deleteAccountFromDB = async (id: string) => {
  const userData = await prisma.user.findUnique({
    where: { id },
  });

  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  await prisma.user.delete({
    where: { id },
  });

  return { message: 'Account deleted successfully!' };
};

export const UserServices = {
  registerUserIntoDB,
  getMyProfileFromDB,
  getMyProfileForSellerFromDB,
  updateMyProfileIntoDB,
  changePassword,
  forgotPassword,
  verifyOtpInDB,
  verifyOtpForgotPasswordInDB,
  updatePasswordIntoDb,
  resendOtpIntoDB,
  resendUserVerificationEmail,
  deleteAccountFromDB,
};
