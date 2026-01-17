import express, { Request, Response } from "express";
import { UserModel } from "../users/model";
import { HttpResponses } from "../../const";
import { authJwtMiddleware } from "../../middlewares/authJwt";
import { jwtService } from "../../services/jwt.service";

export const securityRouter = express.Router();

securityRouter.get("/devices", async (req: Request, res: Response) => {
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

  // Проверяем refresh token
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

  const devices = user.devices.map((d) => ({
    ip: d.ip,
    title: d.title,
    lastActiveDate: d.lastActiveDate,
    deviceId: d.deviceId,
  }));

  return res.status(HttpResponses.OK).send(devices);
});

securityRouter.delete("/devices", async (req: Request, res: Response) => {
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

  // Проверяем refresh token
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

  user.refreshTokens.forEach((token) => {
    if (token.deviceId !== payload.deviceId) {
      token.isValid = false; // ← Инвалидируем
    }
  });

  user.devices = user.devices.filter((d) => d.deviceId === payload.deviceId);
  await user.save();

  return res.sendStatus(HttpResponses.NO_CONTENT);
});

securityRouter.delete(
  "/devices/:deviceId",
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    const { deviceId } = req.params;

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

    // Проверяем refresh token
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

    const deviceExists = user.devices.some((d) => d.deviceId === deviceId);
    if (!deviceExists) {
      const otherUserHasDevice = await UserModel.findOne({
        "devices.deviceId": deviceId,
        _id: { $ne: user._id },
      });

      if (otherUserHasDevice) {
        // Устройство принадлежит другому пользователю - 403
        return res.status(HttpResponses.FORBIDDEN).send({
          errorsMessages: [{ message: "Forbidden" }],
        });
      }

      // Устройство вообще не существует - 404
      return res.status(HttpResponses.NOT_FOUND).send({
        errorsMessages: [{ message: "Device not found" }],
      });
    }

    user.refreshTokens.forEach((token) => {
      if (token.deviceId === deviceId) {
        token.isValid = false; // Инвалидируем
      }
    });

    user.devices = user.devices.filter((d) => d.deviceId != deviceId);

    await user.save();

    return res.sendStatus(HttpResponses.NO_CONTENT);
  }
);
