import mongoose from "mongoose";
import { LikeStatus } from "./enum";
import { PostLikeType } from "./types";

interface IPost {
  title: string;
  shortDescription: string;
  content: string;
  blogId?: string;
  createdAt: string;
  blogName: string;
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
  };
}

const PostLikeSchema = new mongoose.Schema<PostLikeType>({
  postId: { type: String, required: true },
  userId: { type: String, required: true },
  userLogin: { type: String, required: true },
  status: {
    type: String,
    enum: Object.values(LikeStatus),
    required: true,
  },
  addedAt: { type: String, default: () => new Date().toISOString() },
});

// Уникальный индекс: один пользователь - один статус на пост
PostLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const PostLikeModel = mongoose.model("PostLike", PostLikeSchema);

const PostSchema = new mongoose.Schema<IPost>(
  {
    title: { type: String, required: true, maxlength: 30 },
    shortDescription: { type: String, required: true, maxlength: 100 },
    content: { type: String, required: true, maxlength: 1000 },
    blogId: { type: String, required: false },
    createdAt: { type: String, default: () => new Date().toISOString() },
    blogName: { type: String, required: true },
    extendedLikesInfo: {
      likesCount: { type: Number, default: 0, required: true },
      dislikesCount: { type: Number, default: 0, required: true },
    },
  },
  {
    versionKey: false,
    toJSON: {
      transform(doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
      },
    },
  },
);

export const PostModel = mongoose.model("Post", PostSchema);
