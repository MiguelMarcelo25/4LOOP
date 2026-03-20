import mongoose, { Schema } from "mongoose";

mongoose.Promise = global.Promise;

const BusinessSubmissionSnapshotSchema = new Schema(
  {
    business: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      unique: true,
      index: true,
    },
    snapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },
    statusBeforeSubmission: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: true,
  },
);

export default (
  mongoose.models.BusinessSubmissionSnapshot ||
  mongoose.model(
    "BusinessSubmissionSnapshot",
    BusinessSubmissionSnapshotSchema,
  )
);
