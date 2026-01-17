import { Request, Response, NextFunction } from "express";
import { jwtService } from "../services/jwt.service";
import { HttpResponses } from "../const";

export const authJwtMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Получаем токен от клиента
  const authHeader = req.headers.authorization;

  console.log("🔐 Auth header:", authHeader?.substring(0, 30) + "...");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(HttpResponses.UNAUTHORIZED).json({
      errorsMessages: [
        {
          message: "Access token not provided",
          field: "authorization",
        },
      ],
    });
  }

  const token = authHeader.split(" ")[1];

  console.log("🎫 Token extracted:", token.substring(0, 20) + "...");

  // 2. Проверяем токен с помощью jwtService
  const payload = jwtService.verifyAccessToken(token);

  console.log("✅ Payload:", payload);

  if (!payload) {
    return res.status(HttpResponses.UNAUTHORIZED).json({
      errorsMessages: [
        {
          message: "Invalid or expired access token",
          field: "authorization",
        },
      ],
    });
  }

  // 3. Токен валиден - добавляем данные в request
  req.user = {
    userId: payload.userId,
    userLogin: payload.userLogin,
  };

  return next();
};
