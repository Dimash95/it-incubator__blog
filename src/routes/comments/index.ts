import express, { Request, Response } from "express";
import { CommentLikeModel, CommentModel } from "./model";
import { basicAuth } from "../../middlewares/auth";
import {
  createCommentValidation,
  putCommentLikeValidation,
} from "./validation";
import { inputValidation } from "../../middlewares/input-validation";
import { HttpResponses } from "../../const";
import { authJwtMiddleware } from "../../middlewares/authJwt";
import { LikeStatus } from "./enum";

export const commentsRouter = express.Router();

commentsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  const comment = await CommentModel.findById(id);
  const userId = req.user.userId;

  if (!comment)
    return res.status(HttpResponses.NOT_FOUND).send({
      errorsMessages: [
        {
          message: "comment not found",
          field: "id",
        },
      ],
    });

  let myStatus = LikeStatus.None;
  if (userId) {
    const like = await CommentLikeModel.findOne({ commentId: id, userId });
    myStatus = like?.status || LikeStatus.None;
  }

  return res.status(200).send({
    ...comment.toJSON(),
    likesInfo: {
      ...comment.likesInfo,
      myStatus,
    },
  });
});

commentsRouter.put(
  "/:commentId",
  authJwtMiddleware,
  createCommentValidation,
  inputValidation,
  async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const { content } = req.body;

    //  находим комментарий
    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      return res.status(HttpResponses.NOT_FOUND).send({
        errorsMessages: [
          {
            message: "Comment not found",
            field: "id",
          },
        ],
      });
    }

    // Проверяем что это комментарий текущего пользователя!
    if (comment.commentatorInfo.userId !== req.user.userId) {
      return res.status(HttpResponses.FORBIDDEN).send({
        errorsMessages: [
          {
            message: "Access denied",
            field: "commentId",
          },
        ],
      });
    }

    // Обновляем
    comment.content = content;
    await comment.save();

    return res.sendStatus(HttpResponses.NO_CONTENT);
  }
);

commentsRouter.put(
  "/:commentId/like-status",
  authJwtMiddleware,
  putCommentLikeValidation,
  inputValidation,
  async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const { likeStatus } = req.body;
    const userId = req.user.userId;

    //  находим комментарий
    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      return res.status(HttpResponses.NOT_FOUND).send({
        errorsMessages: [
          {
            message: "Comment not found",
            field: "id",
          },
        ],
      });
    }

    // Обновляем
    comment.likesInfo.myStatus = likeStatus;

    // Находим текущий статус пользователя
    const existingLike = await CommentLikeModel.findOne({
      commentId,
      userId,
    });

    const oldStatus = existingLike?.status || LikeStatus.None;

    // Если статус не изменился - ничего не делаем
    if (oldStatus === likeStatus) {
      return res.sendStatus(HttpResponses.NO_CONTENT);
    }

    // Убираем старую реакцию
    if (oldStatus === LikeStatus.Like) comment.likesInfo.likesCount--;
    if (oldStatus === LikeStatus.Dislike) comment.likesInfo.dislikesCount--;

    // Добавляем новую реакцию
    if (likeStatus === LikeStatus.Like) comment.likesInfo.likesCount++;
    if (likeStatus === LikeStatus.Dislike) comment.likesInfo.dislikesCount++;

    // Сохраняем статус в базу
    if (likeStatus === LikeStatus.None) {
      await CommentLikeModel.deleteOne({ commentId, userId });
    } else {
      await CommentLikeModel.findOneAndUpdate(
        { commentId, userId },
        { status: likeStatus },
        { upsert: true }
      );
    }

    await comment.save();

    return res.sendStatus(HttpResponses.NO_CONTENT);
  }
);

commentsRouter.delete(
  "/:commentId",
  authJwtMiddleware,
  async (req: Request, res: Response) => {
    const { commentId } = req.params;

    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      return res.status(HttpResponses.NOT_FOUND).send({
        errorsMessages: [
          {
            message: "Comment not found",
            field: "id",
          },
        ],
      });
    }

    if (comment.commentatorInfo.userId !== req.user.userId) {
      return res.status(HttpResponses.FORBIDDEN).send({
        errorsMessages: [
          {
            message: "Access denied",
            field: "commentId",
          },
        ],
      });
    }

    await CommentModel.findByIdAndDelete(commentId);

    return res.sendStatus(HttpResponses.NO_CONTENT);
  }
);
