import { body } from "express-validator";

export const registrationValidation = [
  body("login")
    .trim()
    .isString()
    .withMessage("login must be a string")
    .notEmpty()
    .withMessage("login is required")
    .isLength({ min: 3, max: 10 })
    .withMessage("login must be between 3 and 10 characters")
    .matches(/^[a-zA-Z0-9_-]*$/)
    .withMessage("login must contain only letters, numbers, _ or -"),

  body("password")
    .trim()
    .isString()
    .withMessage("password must be a string")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 6, max: 20 })
    .withMessage("password must be between 6 and 20 characters"),

  body("email")
    .trim()
    .isString()
    .withMessage("email must be a string")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email must be valid"),
];

export const loginValidation = [
  body("loginOrEmail")
    .trim()
    .isString()
    .withMessage("loginOrEmail must be a string")
    .notEmpty()
    .withMessage("loginOrEmail is required"),

  body("password")
    .trim()
    .isString()
    .withMessage("password must be a string")
    .notEmpty()
    .withMessage("password is required"),
];

export const codeValidation = [
  body("code")
    .trim()
    .isString()
    .withMessage("code must be a string")
    .notEmpty()
    .withMessage("code is required"),
];

export const emailValidation = [
  body("email")
    .trim()
    .isString()
    .withMessage("email must be a string")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email must be valid"),
];

export const newPasswordValidation = [
  body("newPassword")
    .trim()
    .isString()
    .withMessage("new password must be a string")
    .notEmpty()
    .withMessage("new password is required")
    .isLength({ min: 6, max: 20 })
    .withMessage("new password must be between 6 and 20 characters"),

  body("recoveryCode")
    .trim()
    .isString()
    .withMessage("recoveryCode must be a string"),
];
