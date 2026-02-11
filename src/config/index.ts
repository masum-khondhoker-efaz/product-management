import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  csrf_secret: process.env.CSRF_SECRET,
  cookie_secret: process.env.COOKIE_SECRET,
  rateLimit: {
    max: process.env.RATE_LIMIT_MAX,
  },
  jwt: {
    access_secret: process.env.JWT_ACCESS_SECRET,
    access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
    refresh_secret: process.env.JWT_REFRESH_SECRET,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
    otp_secret: process.env.JWT_OTP_SECRET,
    otp_expires_in: process.env.JWT_OTP_EXPIRES_IN,
  },
  emailSender: {
    email: process.env.EMAIL,
    app_pass: process.env.APP_PASS,
  },
  backend_base_url: process.env.BACKEND_BASE_URL,
  frontend_base_url: process.env.FRONTEND_BASE_URL,
};
