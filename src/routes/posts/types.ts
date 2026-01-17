export type PostType = {
  id: string;
  title: string; // 30
  shortDescription: string; // 100
  content: string; // 1000
  blogId: string;
  blogName: string; // 15
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
