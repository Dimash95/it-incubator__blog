

export interface BlogType {
  id: string; // сюда явно добавляем
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}

export type PostBlogType = {
  name: string;
  description: string;
  websiteUrl: string;
};

export type PutBlogType = {
  name: string;
  description: string;
  websiteUrl: string;
};
