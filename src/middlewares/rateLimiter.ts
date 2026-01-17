import { Request, Response, NextFunction } from "express";

const createSimpleLimiter = (windowMs: number, max: number) => {
  // Каждый лимитер имеет свой store
  const store = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.originalUrl || req.url;
    const now = Date.now();

    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
    }

    record.count++;

    console.log(`🔢 ${key}: ${record.count}/${max}`);

    if (record.count > max) {
      console.log(`⛔ BLOCKED ${key}`);
      return res.status(429).json({
        errorsMessages: [{ message: "Too many requests", field: "ip" }],
      });
    }

    store.set(key, record);
    return next();
  };
};

export const registrationLimiter = createSimpleLimiter(10000, 5);
export const loginLimiter = createSimpleLimiter(10000, 5);
export const resendingLimiter = createSimpleLimiter(10000, 5);
export const confirmationLimiter = createSimpleLimiter(10000, 5);
