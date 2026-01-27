import { body } from "express-validator";
import { LikeStatus } from "./enum";

export const postValidation = [
  body("shortDescription")
    .trim()
    .isString()
    .withMessage("ShortDescription must be a string")
    .notEmpty()
    .withMessage("ShortDescription is required")
    .isLength({ max: 100 })
    .withMessage("ShortDescription must be ≤ 100 characters"),

  body("title")
    .trim()
    .isString()
    .withMessage("Title must be a string")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 30 })
    .withMessage("Title must be ≤ 30 characters"),

  body("content")
    .trim()
    .isString()
    .withMessage("Content must be a string")
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ max: 1000 })
    .withMessage("Content must be ≤ 1000 characters"),

  // body("blogId")
  //   .trim()
  //   .isString()
  //   .withMessage("BlogId must be a string")
  //   .notEmpty()
  //   .withMessage("BlogId is required"),
];

export const putPostLikeValidation = [
  body("likeStatus")
    .trim()
    .isString()
    .withMessage("content must be a string")
    .notEmpty()
    .withMessage("content is required")
    .isIn(Object.values(LikeStatus)) // ["None", "Like", "Dislike"]
    .withMessage("likeStatus must be None, Like or Dislike"),
];
