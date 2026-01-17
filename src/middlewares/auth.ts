import { Request, Response, NextFunction } from "express";

export const basicAuth = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers["authorization"];

  if (!auth) {
    return res.sendStatus(401);
  }

  if (!auth.startsWith("Basic ")) {
    return res.sendStatus(401);
  }

  const encoded = auth.split(" ")[1];
  if (!encoded) return res.sendStatus(401);

  const decoded = Buffer.from(encoded, "base64").toString("ascii");

  if (decoded !== "admin:qwerty") return res.sendStatus(401);

  return next();
};
