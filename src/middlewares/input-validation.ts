import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { HttpResponses } from "../const";

export const inputValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return next();

  const formattedErrors = errors
    .array({ onlyFirstError: true })
    .map((err: any) => ({
      message: err.msg,
      field: err.path || err.param,
    }));

  return res.status(HttpResponses.BAD_REQUEST).send({
    errorsMessages: formattedErrors,
  });
};
