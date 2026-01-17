import "dotenv/config";
import express from "express";
import { apiRouter } from "./routes";
import { connectDB } from "./db";
import cookieParser from "cookie-parser";

const app = express();
app.set("trust proxy", 1);

app.use((req, res, next) => {
  console.log("📨 Request IP:", req.ip, "URL:", req.originalUrl);
  next();
});

app.use(express.json());
app.use(cookieParser());
app.use(apiRouter);

async function start() {
  await connectDB();

  app.listen(process.env.PORT || 6060, () => {
    console.log(`Example app listening on port ${process.env.PORT}`);
  });
}

start();

export default app;
