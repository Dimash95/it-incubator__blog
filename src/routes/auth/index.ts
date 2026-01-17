import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { UserModel } from "../users/model";
import { emailService } from "../../services/email.service";
import { HttpResponses } from "../../const";
import { inputValidation } from "../../middlewares/input-validation";
import {
  registrationValidation,
  emailValidation,
  codeValidation,
  newPasswordValidation,
} from "./validation";

import { jwtService } from "../../services/jwt.service";
import { authJwtMiddleware } from "../../middlewares/authJwt";
import { loginValidation } from "./validation";
import {
  loginLimiter,
  registrationLimiter,
  confirmationLimiter,
  resendingLimiter,
} from "../../middlewares/rateLimiter";

export const authRouter = express.Router();

authRouter.post(
  "/login",
  loginLimiter,
  loginValidation,
  inputValidation,
  async (req: Request, res: Response) => {
    const { loginOrEmail, password } = req.body;

    const user = await UserModel.findOne({
      $or: [{ login: loginOrEmail }, { email: loginOrEmail }],
    });

    if (!user) {
      return res.status(HttpResponses.UNAUTHORIZED).send({
        errorsMessages: [
          {
            message: "Invalid credentials",
            field: "loginOrEmail",
          },
        ],
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(HttpResponses.UNAUTHORIZED).send({
        errorsMessages: [
          {
            message: "Invalid credentials",
            field: "password",
          },
        ],
      });
    }

    if (!user.emailConfirmation.isConfirmed) {
      return res.status(HttpResponses.UNAUTHORIZED).send({
        errorsMessages: [
          {
            message: "Email not confirmed",
            field: "email",
          },
        ],
      });
    }

    const ip = req.ip || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    const deviceId = crypto.randomUUID();

    const newDevice = {
      ip,
      title: userAgent,
      lastActiveDate: new Date(),
      deviceId,
    };

    user.devices.push(newDevice);

    // Генерируем токены
    const accessToken = jwtService.generateAccessToken(
      user._id.toString(),
      user.login
    );

    const {
      token: refreshToken,
      tokenId,
      expiresAt,
    } = jwtService.generateRefreshToken(
      user._id.toString(),
      user.login,
      deviceId
    );

    // Сохраняем refreshToken в БД
    user.refreshTokens.push({
      token: tokenId,
      deviceId,
      isValid: true,
      createdAt: new Date(),
      expiresAt,
    });

    await user.save();

    // Отправляем refreshToken в cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    // Возвращаем accessToken в body
    return res.status(HttpResponses.OK).json({
      accessToken,
    });
  }
);

// POST /auth/registration
authRouter.post(
  "/registration",
  registrationLimiter,
  registrationValidation,
  inputValidation,
  async (req: Request, res: Response) => {
    const { login, password, email } = req.body;

    const userByLogin = await UserModel.findOne({ login });
    const userByEmail = await UserModel.findOne({ email });

    if (userByLogin) {
      return res.status(HttpResponses.BAD_REQUEST).send({
        errorsMessages: [
          {
            message: "User with this login already exists",
            field: "login",
          },
        ],
      });
    }

    if (userByEmail) {
      return res.status(HttpResponses.BAD_REQUEST).send({
        errorsMessages: [
          {
            message: "User with this email already exists",
            field: "email",
          },
        ],
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const confirmationCode = crypto.randomUUID();

    // Создаем дату истечения (через 1 час)
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    await UserModel.create({
      login,
      password: hashedPassword,
      email,
      emailConfirmation: {
        confirmationCode,
        expirationDate,
        isConfirmed: false,
      },
    });

    try {
      await emailService.sendRegistrationEmail(email, confirmationCode);
    } catch (error) {
      console.error("Email sending failed:", error);
    }

    return res.sendStatus(HttpResponses.NO_CONTENT);
  }
);

// POST /auth/registration-confirmation
authRouter.post(
  "/registration-confirmation",
  confirmationLimiter,
  codeValidation,
  inputValidation,
  async (req: Request, res: Response) => {
    const { code } = req.body;

    const user = await UserModel.findOne({
      "emailConfirmation.confirmationCode": code,
    });

    if (!user) {
      return res.status(HttpResponses.BAD_REQUEST).send({
        errorsMessages: [
          {
            message: "Confirmation code is incorrect",
            field: "code",
          },
        ],
      });
    }

    if (user.emailConfirmation.expirationDate < new Date()) {
      return res.status(HttpResponses.BAD_REQUEST).send({
        errorsMessages: [
          {
            message: "Confirmation code expired",
            field: "code",
          },
        ],
      });
    }

    if (user.emailConfirmation.isConfirmed) {
      return res.status(HttpResponses.BAD_REQUEST).send({
        errorsMessages: [
          {
            message: "Email already confirmed",
            field: "code",
          },
        ],
      });
    }

    user.emailConfirmation.isConfirmed = true;
    await user.save();

    return res.sendStatus(HttpResponses.NO_CONTENT);
  }
);

// POST /auth/registration-email-resending
authRouter.post(
  "/registration-email-resending",
  resendingLimiter,
  emailValidation,
  inputValidation,
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(HttpResponses.BAD_REQUEST).send({
        errorsMessages: [
          {
            message: "User with this email not found",
            field: "email",
          },
        ],
      });
    }

    // ← ПРОВЕРКУ ПОДТВЕРЖДЕНИЯ ПЕРЕМЕСТИЛИ РАНЬШЕ!
    if (user.emailConfirmation.isConfirmed) {
      return res.status(HttpResponses.BAD_REQUEST).send({
        errorsMessages: [
          {
            message: "Email already confirmed",
            field: "email",
          },
        ],
      });
    }

    const newConfirmationCode = crypto.randomUUID();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    user.emailConfirmation.confirmationCode = newConfirmationCode;
    user.emailConfirmation.expirationDate = expirationDate;
    await user.save();

    await emailService.sendRegistrationEmail(email, newConfirmationCode);

    return res.sendStatus(HttpResponses.NO_CONTENT);
  }
);

// POST /auth/refresh-token
authRouter.post("/refresh-token", async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(HttpResponses.UNAUTHORIZED).send({
      errorsMessages: [
        {
          message: "Refresh token not provided",
          field: "refreshToken",
        },
      ],
    });
  }

  // Проверяем валидность токена
  const payload = jwtService.verifyRefreshToken(refreshToken);
  if (!payload) {
    return res.status(HttpResponses.UNAUTHORIZED).send({
      errorsMessages: [
        {
          message: "Invalid or expired refresh token",
          field: "refreshToken",
        },
      ],
    });
  }

  // Находим пользователя
  const user = await UserModel.findById(payload.userId);
  if (!user) {
    return res.status(HttpResponses.UNAUTHORIZED).send({
      errorsMessages: [
        {
          message: "User not found",
          field: "userId",
        },
      ],
    });
  }

  // Проверяем, что токен валиден в БД
  const tokenInDb = user.refreshTokens.find(
    (t) => t.token === payload.tokenId && t.isValid
  );

  if (!tokenInDb) {
    return res.status(HttpResponses.UNAUTHORIZED).send({
      errorsMessages: [
        {
          message: "Refresh token is invalid or revoked",
          field: "refreshToken",
        },
      ],
    });
  }

  // Инвалидируем старый токен
  tokenInDb.isValid = false;

  // Генерируем новую пару токенов
  const newAccessToken = jwtService.generateAccessToken(
    user._id.toString(),
    user.login
  );

  const {
    token: newRefreshToken,
    tokenId: newTokenId,
    expiresAt: newExpiresAt,
  } = jwtService.generateRefreshToken(
    user._id.toString(),
    user.login,
    payload.deviceId
  );

  // Обновляем lastActiveDate устройства
  const device = user.devices.find((d) => d.deviceId === payload.deviceId);
  if (device) {
    device.lastActiveDate = new Date();
  }

  user.refreshTokens.push({
    token: newTokenId,
    isValid: true,
    deviceId: payload.deviceId,
    createdAt: new Date(),
    expiresAt: newExpiresAt,
  });

  await user.save();

  // Отправляем новый refreshToken в cookie
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
  });

  // Возвращаем новый accessToken в body
  return res.status(HttpResponses.OK).json({
    accessToken: newAccessToken,
  });
});

// POST /auth/logout
authRouter.post("/logout", async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(HttpResponses.UNAUTHORIZED).send({
      errorsMessages: [
        {
          message: "Refresh token not provided",
          field: "refreshToken",
        },
      ],
    });
  }

  // Проверяем валидность токена
  const payload = jwtService.verifyRefreshToken(refreshToken);
  if (!payload) {
    return res.status(HttpResponses.UNAUTHORIZED).send({
      errorsMessages: [
        {
          message: "Invalid refresh token",
          field: "refreshToken",
        },
      ],
    });
  }

  // Находим пользователя
  const user = await UserModel.findById(payload.userId);
  if (!user) {
    return res.status(HttpResponses.UNAUTHORIZED).send({
      errorsMessages: [
        {
          message: "User not found",
          field: "userId",
        },
      ],
    });
  }

  // Находим токен в БД
  const tokenInDb = user.refreshTokens.find((t) => t.token === payload.tokenId);

  if (!tokenInDb || !tokenInDb.isValid) {
    return res.status(HttpResponses.UNAUTHORIZED).send({
      errorsMessages: [
        {
          message: "Refresh token is invalid or already revoked",
          field: "refreshToken",
        },
      ],
    });
  }

  // Инвалидируем токен
  tokenInDb.isValid = false;
  await user.save();

  user.devices = user.devices.filter((d) => d.deviceId !== payload.deviceId);
  await user.save();

  // Очищаем cookie
  res.clearCookie("refreshToken");

  return res.sendStatus(HttpResponses.NO_CONTENT);
});

// GET /auth/me
authRouter.get(
  "/me",
  authJwtMiddleware,
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(HttpResponses.UNAUTHORIZED).send({
        errorsMessages: [
          {
            message: "User not found",
            field: "userId",
          },
        ],
      });
    }

    return res.status(HttpResponses.OK).json({
      userId: user._id.toString(),
      login: user.login,
      email: user.email,
    });
  }
);

authRouter.post(
  "/password-recovery",
  resendingLimiter,
  emailValidation,
  inputValidation,
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      // for prevent user's email detection
      return res.sendStatus(HttpResponses.NO_CONTENT);
    }

    const recoveryCode = crypto.randomUUID();

    // Создаем дату истечения (через 1 час)
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          "emailConfirmation.recoveryCode": recoveryCode,
          "emailConfirmation.expirationDate": expirationDate,
        },
      }
    );

    try {
      await emailService.sendPasswordRecovery(email, recoveryCode);
    } catch (error) {
      console.error("Email sending failed:", error);
    }

    return res.sendStatus(HttpResponses.NO_CONTENT);
  }
);

authRouter.post(
  "/new-password",
  resendingLimiter,
  newPasswordValidation,
  inputValidation,
  async (req: Request, res: Response) => {
    const { newPassword, recoveryCode } = req.body;

    const user = await UserModel.findOne({
      "emailConfirmation.recoveryCode": recoveryCode,
    });

    if (!user) {
      return res.status(HttpResponses.BAD_REQUEST).send({
        errorsMessages: [
          {
            message: "Confirmation code is incorrect",
            field: "recoveryCode",
          },
        ],
      });
    }

    if (user.emailConfirmation.expirationDate < new Date()) {
      return res.status(HttpResponses.BAD_REQUEST).send({
        errorsMessages: [
          {
            message: "Confirmation code expired",
            field: "recoveryCode",
          },
        ],
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.emailConfirmation.isConfirmed = true;
    user.password = hashedPassword;
    await user.save();

    return res.sendStatus(HttpResponses.NO_CONTENT);
  }
);
