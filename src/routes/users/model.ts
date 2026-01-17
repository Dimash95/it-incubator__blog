import mongoose from "mongoose";
import { DeviceType, IRefreshToken, UserType } from "./types";

const RefreshTokenSchema = new mongoose.Schema<IRefreshToken>({
  token: { type: String, required: true },
  deviceId: { type: String, required: true },
  isValid: { type: Boolean, required: true, default: true },
  createdAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true },
});

const DeviceSchema = new mongoose.Schema<DeviceType>(
  {
    ip: { type: String, required: true },
    title: { type: String, required: true },
    lastActiveDate: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    deviceId: { type: String, required: true },
  },
  {
    _id: false,
  }
);

const UserSchema = new mongoose.Schema(
  {
    login: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
    emailConfirmation: {
      confirmationCode: { type: String },
      recoveryCode: { type: String },
      expirationDate: { type: Date },
      isConfirmed: { type: Boolean, default: false },
    },
    refreshTokens: { type: [RefreshTokenSchema], default: [] },
    devices: { type: [DeviceSchema], default: [] },
  },
  {
    versionKey: false,
    toJSON: {
      transform(doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
      },
    },
  }
);

export const UserModel = mongoose.model<UserType>("User", UserSchema);
