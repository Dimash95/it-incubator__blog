import { LikeStatus } from "./enum";

export type PostType = {
  id: string;
  title: string; // 30
  shortDescription: string; // 100
  content: string; // 1000
  blogId: string;
  blogName: string; // 15
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
    newestLikes: LikeDetailsType[];
  };
};

export type LikeDetailsType = {
  addedAt: string;
  userId: string;
  login: string;
};

export type PostPostType = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
};

export type PutPostType = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
};

export interface PostLikeType {
  postId: string;
  userId: string;
  userLogin: string;
  status: LikeStatus;
  addedAt: string;
}
