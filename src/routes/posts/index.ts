import express, { Request, Response } from "express";
import { PostLikeModel, PostModel } from "./model";
import { BlogModel } from "../blogs/model";
import { postValidation, putPostLikeValidation } from "./validation";
import { basicAuth } from "../../middlewares/auth";
import { inputValidation } from "../../middlewares/input-validation";
import { HttpResponses } from "../../const";
import { createCommentValidation } from "../comments/validation";
import { CommentLikeModel, CommentModel } from "../comments/model";
import { authJwtMiddleware } from "../../middlewares/authJwt";
import { jwtService } from "../../services/jwt.service";
import { LikeStatus } from "../comments/enum";

export const postsRouter = express.Router();

async function getExtendedLikesInfo(postId: string, userId: string | null) {
  const post = await PostModel.findById(postId);

  if (!post) return null;

  let myStatus = LikeStatus.None;
  if (userId) {
    const like = await PostLikeModel.findOne({ postId, userId });
    myStatus = like?.status || LikeStatus.None;
  }

  // Получаем последние 3 лайка
  const newestLikes = await PostLikeModel.find({
    postId,
    status: LikeStatus.Like,
  })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

  return {
    likesCount: post?.extendedLikesInfo?.likesCount,
    dislikesCount: post?.extendedLikesInfo?.dislikesCount,
    myStatus,
    newestLikes: newestLikes.map((like) => ({
      addedAt: like.addedAt,
      userId: like.userId,
      login: like.userLogin,
    })),
  };
}

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

  // ДОБАВЛЕНО: получаем userId из токена
  const token = req.headers.authorization?.split(" ")[1];
  let userId: string | null = null;

  if (token) {
    const payload = jwtService.verifyAccessToken(token);
    userId = payload?.userId || null;
  }

  // формируем extendedLikesInfo
  const extendedLikesInfo = await getExtendedLikesInfo(
    String(req.params.id),
    userId,
  );

  // добавляем extendedLikesInfo в ответ
  return res.status(HttpResponses.OK).send({
    ...post.toJSON(),
    extendedLikesInfo,
  });
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

  // получаем userId из токена
  const token = req.headers.authorization?.split(" ")[1];
  let userId: string | null = null;

  if (token) {
    const payload = jwtService.verifyAccessToken(token);
    userId = payload?.userId || null;
  }

  // для каждого поста формируем extendedLikesInfo
  const postsWithLikes = await Promise.all(
    filteredPosts.map(async (post) => {
      const extendedLikesInfo = await getExtendedLikesInfo(
        post._id.toString(),
        userId,
      );
      return {
        ...post.toJSON(),
        extendedLikesInfo,
      };
    }),
  );

  //возвращаем postsWithLikes вместо filteredPosts
  const result = {
    pagesCount,
    page: pageNumber,
    pageSize,
    totalCount,
    items: postsWithLikes, // ← было filteredPosts
  };

  return res.status(HttpResponses.OK).send(result);
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

    // ИЗМЕНЕНО: добавляем extendedLikesInfo в ответ
    return res.status(HttpResponses.CREATED).send({
      ...newPost.toJSON(),
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatus.None,
        newestLikes: [],
      },
    });
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

postsRouter.put(
  "/:postId/like-status",
  authJwtMiddleware,
  putPostLikeValidation,
  inputValidation,
  async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { likeStatus } = req.body;
    const userId = req.user.userId;
    const userLogin = req.user.userLogin;

    // ИСПРАВЛЕНО: было CommentModel, теперь PostModel
    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(HttpResponses.NOT_FOUND).send({
        errorsMessages: [
          {
            message: "Post not found", // ИСПРАВЛЕНО: было "Comment not found"
            field: "id",
          },
        ],
      });
    }

    // ИСПРАВЛЕНО: было CommentLikeModel, теперь PostLikeModel
    const existingLike = await PostLikeModel.findOne({
      postId,
      userId,
    });

    const oldStatus = existingLike?.status || LikeStatus.None;

    if (oldStatus === likeStatus) {
      return res.sendStatus(HttpResponses.NO_CONTENT);
    }

    // используем обычное обращение без ?. так как пост точно существует
    if (oldStatus === LikeStatus.Like) {
      post.extendedLikesInfo.likesCount--;
    }
    if (oldStatus === LikeStatus.Dislike) {
      post.extendedLikesInfo.dislikesCount--;
    }

    if (likeStatus === LikeStatus.Like) {
      post.extendedLikesInfo.likesCount++;
    }
    if (likeStatus === LikeStatus.Dislike) {
      post.extendedLikesInfo.dislikesCount++;
    }

    // ИСПРАВЛЕНО: PostLikeModel, добавлено addedAt
    if (likeStatus === LikeStatus.None) {
      await PostLikeModel.deleteOne({ postId, userId });
    } else {
      await PostLikeModel.findOneAndUpdate(
        { postId, userId },
        {
          status: likeStatus,
          userLogin,
          addedAt: new Date().toISOString(), // ДОБАВЛЕНО
        },
        { upsert: true },
      );
    }

    await post.save();

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
