import express, { Request, Response } from "express";
import { PostModel } from "./model";
import { BlogModel } from "../blogs/model";
import { postValidation } from "./validation";
import { basicAuth } from "../../middlewares/auth";
import { inputValidation } from "../../middlewares/input-validation";
import { HttpResponses } from "../../const";
import { createCommentValidation } from "../comments/validation";
import { CommentLikeModel, CommentModel } from "../comments/model";
import { authJwtMiddleware } from "../../middlewares/authJwt";
import { jwtService } from "../../services/jwt.service";
import { LikeStatus } from "../comments/enum";

export const postsRouter = express.Router();

postsRouter.get("/:postId/comments", async (req: Request, res: Response) => {
  let {
    sortBy = "createdAt",
    sortDirection = "desc",
    pageNumber = 1,
    pageSize = 10,
  } = req.query;

  const { postId } = req.params;

  const post = await PostModel.findById(postId);

  if (!post)
    return res.status(HttpResponses.NOT_FOUND).send({
      errorsMessages: [{ field: "postId", message: "Invalid postId" }],
    });

  const token = req.headers.authorization?.split(" ")[1];
  let userId: string | null = null;

  if (token) {
    const payload = jwtService.verifyAccessToken(token);
    userId = payload?.userId || null;
  }

  pageSize = +pageSize;
  pageNumber = +pageNumber;

  const sortCreatedAt = () => (sortDirection === "asc" ? "asc" : "desc");

  const comments = await CommentModel.find({ postId }).sort({
    [`${sortBy}`]: sortCreatedAt(),
  });

  const totalCount = comments.length;
  const pagesCount = Math.ceil(totalCount / pageSize);

  const filteredComments = comments.slice(
    (pageNumber - 1) * pageSize,
    (pageNumber - 1) * pageSize + pageSize,
  );

  const commentsWithStatus = await Promise.all(
    filteredComments.map(async (comment) => {
      let myStatus = LikeStatus.None;

      if (userId) {
        const like = await CommentLikeModel.findOne({
          commentId: comment._id.toString(),
          userId,
        });
        myStatus = like?.status || LikeStatus.None;
      }

      return {
        ...comment.toJSON(),
        likesInfo: {
          likesCount: comment.likesInfo.likesCount,
          dislikesCount: comment.likesInfo.dislikesCount,
          myStatus,
        },
      };
    }),
  );

  const result = {
    pagesCount,
    page: pageNumber,
    pageSize,
    totalCount,
    items: commentsWithStatus,
  };

  return res.status(HttpResponses.OK).send(result);
});

postsRouter.get("/:id", async (req: Request, res: Response) => {
  const post = await PostModel.findById(req.params.id);

  if (!post)
    return res.status(HttpResponses.NOT_FOUND).send({
      errorsMessages: [
        {
          message: "Post not found",
          field: "id",
        },
      ],
    });

  return res.status(HttpResponses.OK).send(post);
});

postsRouter.get("/", async (req: Request, res: Response) => {
  let {
    sortBy = "createdAt",
    sortDirection = "desc",
    pageNumber = 1,
    pageSize = 10,
  } = req.query;

  pageSize = +pageSize;
  pageNumber = +pageNumber;

  const sortCreatedAt = () => (sortDirection === "asc" ? "asc" : "desc");

  const posts = await PostModel.find().sort({
    [`${sortBy}`]: sortCreatedAt(),
  });

  const totalCount = posts.length;
  const pagesCount = Math.ceil(totalCount / pageSize);

  const filteredPosts = posts.slice(
    (pageNumber - 1) * pageSize,
    (pageNumber - 1) * pageSize + pageSize,
  );

  const result = {
    pagesCount,
    page: pageNumber,
    pageSize,
    totalCount,
    items: filteredPosts,
  };

  return res.status(HttpResponses.OK).send(result); // ← И тут добавил return!
});

// создание коммента

postsRouter.post(
  "/:postId/comments",
  authJwtMiddleware,
  createCommentValidation,
  inputValidation,
  async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { content } = req.body;

    const post = await PostModel.findById(postId);

    if (!post)
      return res.status(HttpResponses.NOT_FOUND).send({
        errorsMessages: [{ field: "postId", message: "Invalid postId" }],
      });

    const newComment = await CommentModel.create({
      content,
      postId,
      commentatorInfo: {
        userId: req.user.userId,
        userLogin: req.user.userLogin,
      },
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
      },
    });

    // В ответ добавляем myStatus (но НЕ сохраняем в базу)
    return res.status(HttpResponses.CREATED).send({
      ...newComment.toJSON(),
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatus.None, // ← Добавляется только в ответ!
      },
    });
  },
);

postsRouter.post(
  "/",
  basicAuth,
  postValidation,
  inputValidation,
  async (req: Request, res: Response) => {
    const { title, shortDescription, content, blogId } = req.body;

    const blog = await BlogModel.findById(blogId);

    if (!blog)
      return res.status(HttpResponses.NOT_FOUND).send({
        errorsMessages: [{ field: "blogId", message: "Invalid blogId" }],
      });

    const newPost = await PostModel.create({
      title,
      shortDescription,
      content,
      blogId,
      blogName: blog.name,
    });

    return res.status(HttpResponses.CREATED).send(newPost);
  },
);

postsRouter.put(
  "/:id",
  basicAuth,
  postValidation,
  inputValidation,
  async (req: Request, res: Response) => {
    const { title, shortDescription, content, blogId } = req.body;

    const blog = await BlogModel.findById(blogId);
    if (!blog)
      return res.status(HttpResponses.NOT_FOUND).send({
        errorsMessages: [
          {
            message: "Blog not found",
            field: "id",
          },
        ],
      });

    const updated = await PostModel.findByIdAndUpdate(
      req.params.id,
      {
        title,
        shortDescription,
        content,
        blogId,
        blogName: blog.name,
      },
      { new: true },
    );

    if (!updated)
      return res.status(HttpResponses.NOT_FOUND).send({
        errorsMessages: [
          {
            message: "Post not found",
            field: "id",
          },
        ],
      });

    return res.sendStatus(HttpResponses.NO_CONTENT);
  },
);

postsRouter.delete("/:id", basicAuth, async (req, res) => {
  const deleted = await PostModel.findByIdAndDelete(req.params.id);

  if (!deleted)
    return res.status(HttpResponses.NOT_FOUND).send({
      errorsMessages: [
        {
          message: "Post not found",
          field: "id",
        },
      ],
    });

  return res.sendStatus(HttpResponses.NO_CONTENT);
});
