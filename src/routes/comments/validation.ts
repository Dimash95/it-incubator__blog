import { body } from "express-validator";
import { LikeStatus } from "./enum";

export const createCommentValidation = [
  body("content")
    .trim()
    .isString()
    .withMessage("content must be a string")
    .notEmpty()
    .withMessage("content is required")
    .isLength({ min: 15, max: 300 })
    .withMessage("content must be 15 - 300"),
];

export const putCommentLikeValidation = [
  body("likeStatus")
    .trim()
    .isString()
    .withMessage("content must be a string")
    .notEmpty()
    .withMessage("content is required")
    .isIn(Object.values(LikeStatus)) // ["None", "Like", "Dislike"]
    .withMessage("likeStatus must be None, Like or Dislike"),
];
