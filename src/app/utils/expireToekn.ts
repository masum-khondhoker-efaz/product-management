import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import httpStatus from "http-status";
import AppError from "../errors/AppError";

export const expireToken = (token: string, secret: Secret) => {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp > now) {
        // Set the token's expiration time to the current time to invalidate it
        decoded.exp = now;
        return jwt.sign(decoded, secret, { algorithm: "HS256" });
    }   else {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Token already expired');
    }   
    } catch (error) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token');
    }
};
