import mongoose from "mongoose";
import { BlogType } from "./types";

const BlogSchema = new mongoose.Schema<BlogType>(
  {
    name: { type: String, required: true, maxlength: 15 },
    description: { type: String, required: true, maxlength: 500 },
    websiteUrl: { type: String, required: true, maxlength: 100 },
    createdAt: { type: String, default: () => new Date().toISOString() },
    isMembership: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    toJSON: {
      transform(doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
      },
    },
  }
);

export const BlogModel = mongoose.model("Blog", BlogSchema);
