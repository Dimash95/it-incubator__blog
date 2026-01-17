import { LikeStatus } from "./enum";

export interface CommentType {
  id: string;
  content: string;
  postId: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
  };
  createdAt: string;
}

export type PostCommentType = {
  content: string;
};

export type PutCommentType = {
  content: string;
};
