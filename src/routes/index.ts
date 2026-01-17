import express from "express";
import { dropRouter } from "./drop";
import { authRouter } from "./auth";
import { blogsRouter } from "./blogs";
import { postsRouter } from "./posts";
import { usersRouter } from "./users";
import { commentsRouter } from "./comments";
import { securityRouter } from "./security";

export const apiRouter = express.Router();

apiRouter.use("/testing/all-data", dropRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/blogs", blogsRouter);
apiRouter.use("/posts", postsRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/comments", commentsRouter);
apiRouter.use("/security", securityRouter);
