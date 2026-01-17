declare global {
  namespace Express {
    export interface Request {
      user: {
        userId: string;
        userLogin: string;
      };
    }
  }
}

export {};
