export interface IRefreshToken {
  token: string;
  deviceId: String;
  isValid: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export type DeviceType = {
  ip: string;
  title: string;
  lastActiveDate: Date;
  deviceId: string;
};

export type UserType = {
  id: string;
  login: string;
  email: string;
  password: string;
  createdAt: string;
  emailConfirmation: {
    confirmationCode: string;
    expirationDate: Date;
    isConfirmed: boolean;
  };
  refreshTokens: IRefreshToken[];
  devices: DeviceType[];
};

export type PostUserType = {
  login: string;
  email: string;
  password: string;
  createdAt: string;
};

export type PutUserType = {
  login: string;
  email: string;
  password: string;
  createdAt: string;
};
