import express, { Request, Response } from "express";

import { BlogModel } from "../blogs/model";
import { PostModel } from "../posts/model";
import { UserModel } from "../users/model";

import { HttpResponses } from "../../const";

const dropRouter = express.Router();

dropRouter.delete("/", async (req: Request, res: Response) => {
  try {
    await BlogModel.deleteMany({});
    await PostModel.deleteMany({});
    await UserModel.deleteMany({});

    return res.sendStatus(HttpResponses.NO_CONTENT);
  } catch (error) {
    console.error("Drop DB error:", error);
    return res.status(HttpResponses.INTERNAL_ERROR).send("Error dropping data");
  }
});

export { dropRouter };
