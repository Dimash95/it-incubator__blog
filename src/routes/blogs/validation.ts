import { body } from "express-validator";

export const createBlogValidation = [
  body("websiteUrl")
    .trim()
    .isString()
    .withMessage("websiteUrl must be a string")
    .notEmpty()
    .withMessage("websiteUrl is required")
    .isLength({ max: 100 })
    .withMessage("websiteUrl is too long")
    .matches(/^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+$/)
    .withMessage("websiteUrl is not valid"),

  body("name")
    .trim()
    .isString()
    .withMessage("name must be a string")
    .notEmpty()
    .withMessage("name is required")
    .isLength({ max: 15 })
    .withMessage("name is too long"),

  body("description")
    .trim()
    .isString()
    .withMessage("description must be a string")
    .notEmpty()
    .withMessage("description is required")
    .isLength({ max: 500 })
    .withMessage("description is too long"),
];
