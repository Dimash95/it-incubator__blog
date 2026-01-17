import { body } from "express-validator";

export const userValidation = [
  body("login")
    .trim()
    .isString()
    .withMessage("login must be a string")
    .notEmpty()
    .withMessage("login is required")
    .isLength({ min: 3 })
    .withMessage("login is too long")
    .isLength({ max: 10 })
    .withMessage("login is too long")
    .matches(/^[a-zA-Z0-9_-]*$/)
    .withMessage("login must contain only letters, numbers, _ or -"),

  body("password")
    .trim()
    .isString()
    .withMessage("password must be a string")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 6 })
    .withMessage("password is too long")
    .isLength({ max: 20 })
    .withMessage("login is too long"),

  body("email")
    .trim()
    .isString()
    .withMessage("email must be a string")
    .notEmpty()
    .withMessage("email is required")
    .isEmail(),
];
