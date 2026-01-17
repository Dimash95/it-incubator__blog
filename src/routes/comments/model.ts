import mongoose from "mongoose";
import { CommentType } from "./types";
import { LikeStatus } from "./enum";

export interface CommentLikeType {
  commentId: string;
  userId: string;
  status: LikeStatus;
  createdAt: string;
}

const CommentLikeSchema = new mongoose.Schema<CommentLikeType>({
  commentId: { type: String, required: true },
  userId: { type: String, required: true },
  status: {
    type: String,
    enum: Object.values(LikeStatus),
    required: true,
  },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

// Уникальный индекс: один пользователь - один статус на комментарий
CommentLikeSchema.index({ commentId: 1, userId: 1 }, { unique: true });

export const CommentLikeModel = mongoose.model(
  "CommentLike",
  CommentLikeSchema
);

const CommentSchema = new mongoose.Schema<CommentType>(
  {
    content: { type: String, required: true, maxlength: 300, minLength: 15 },
    commentatorInfo: {
      userId: { type: String, required: true },
      userLogin: { type: String, required: true },
    },
    postId: { type: String, required: false },
    createdAt: { type: String, default: () => new Date().toISOString() },
    likesInfo: {
      likesCount: { type: Number, default: 0 },
      dislikesCount: { type: Number, default: 0 },
    },
  },
  {
    versionKey: false,
    toJSON: {
      transform(doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.postId;
      },
    },
  }
);

export const CommentModel = mongoose.model("Comment", CommentSchema);
