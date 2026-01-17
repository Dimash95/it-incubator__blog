import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";

import { UserModel } from "./model";
import { basicAuth } from "../../middlewares/auth";
import { inputValidation } from "../../middlewares/input-validation";
import { HttpResponses } from "../../const";
import { userValidation } from "./validation";

export const usersRouter = express.Router();

usersRouter.get("/", async (req: Request, res: Response) => {
  let {
    searchLoginTerm = "",
    searchEmailTerm = "",
    sortBy = "createdAt",
    sortDirection = "desc",
    pageNumber = 1,
    pageSize = 10,
  } = req.query;

  pageSize = +pageSize;
  pageNumber = +pageNumber;

  const sortCreatedAt = () => (sortDirection === "asc" ? "asc" : "desc");

  const users = await UserModel.find({
    $or: [
      { login: { $regex: searchLoginTerm, $options: "i" } },
      { email: { $regex: searchEmailTerm, $options: "i" } },
    ],
  }).sort({
    [`${sortBy}`]: sortCreatedAt(),
  });

  const totalCount = users.length;
  const pagesCount = Math.ceil(totalCount / pageSize);

  const filteredUsers = users.slice(
    (pageNumber - 1) * pageSize,
    (pageNumber - 1) * pageSize + pageSize
  );

  const mappedUser = () =>
    filteredUsers.map((user) => {
      const { id, login, email, createdAt } = user;
      return { id, login, email, createdAt };
    });

  const result = {
    pagesCount,
    page: pageNumber,
    pageSize,
    totalCount,
    items: mappedUser(),
  };

  res.status(HttpResponses.OK).send(result);
});

usersRouter.post(
  "/",
  basicAuth,
  userValidation,
  inputValidation,
  async (req: Request, res: Response) => {
    const { login, password, email } = req.body;

    const userByLogin = await UserModel.findOne({ login });
    const userByEmail = await UserModel.findOne({ email });

    if (userByLogin) {
      return res.status(HttpResponses.BAD_REQUEST).send({
        errorsMessages: [
          {
            message: "login should be unique",
            field: "login",
          },
        ],
      });
    }

    if (userByEmail) {
      return res.status(HttpResponses.BAD_REQUEST).send({
        errorsMessages: [
          {
            message: "email should be unique",
            field: "email",
          },
        ],
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Супер админ создает пользователя с уже подтвержденным email
    const newUser = await UserModel.create({
      login,
      password: hashedPassword,
      email,
      emailConfirmation: {
        confirmationCode: "",
        expirationDate: new Date(),
        isConfirmed: true, // ← Сразу подтвержден!
      },
    });

    const returnedUser = {
      id: newUser.id,
      login: newUser.login,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };

    return res.status(HttpResponses.CREATED).send(returnedUser);
  }
);

usersRouter.delete("/:id", basicAuth, async (req, res) => {
  const deleted = await UserModel.findByIdAndDelete(req.params.id);

  if (!deleted)
    return res.status(HttpResponses.NOT_FOUND).send({
      errorsMessages: [
        {
          message: "User not found",
          field: "id",
        },
      ],
    });

  return res.sendStatus(HttpResponses.NO_CONTENT);
});
