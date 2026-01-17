import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access-secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "refresh-secret";

export interface TokenPayload {
  userId: string;
  userLogin: string;
}

export interface RefreshTokenPayload extends TokenPayload {
  tokenId: string;
  deviceId: string;
}

export class JwtService {
  // Генерация access token (10 секунд)
  generateAccessToken(userId: string, userLogin: string): string {
    const payload: TokenPayload = { userId, userLogin };
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "10m" });
  }

  // Генерация refresh token (20 секунд)
  generateRefreshToken(
    userId: string,
    userLogin: string,
    deviceId: string
  ): {
    token: string;
    tokenId: string;
    expiresAt: Date;
  } {
    const tokenId = crypto.randomUUID();
    const payload: RefreshTokenPayload = {
      userId,
      userLogin,
      tokenId,
      deviceId,
    };
    const token = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "10m" });

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getMinutes() + 10);

    return { token, tokenId, expiresAt };
  }

  // Проверка access token
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  // Проверка refresh token
  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
    } catch (error) {
      return null;
    }
  }
}

export const jwtService = new JwtService();
