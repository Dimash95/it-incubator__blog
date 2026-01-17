import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 30 },
    shortDescription: { type: String, required: true, maxlength: 100 },
    content: { type: String, required: true, maxlength: 1000 },
    blogId: { type: String, required: false },
    createdAt: { type: String, default: () => new Date().toISOString() },
    blogName: { type: String, required: true },
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

export const PostModel = mongoose.model("Post", PostSchema);
