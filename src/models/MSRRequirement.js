import mongoose, { Schema } from "mongoose";

const MSRRequirementSchema = new Schema(
  {
    label: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const MSRRequirement =
  mongoose.models.MSRRequirement || mongoose.model("MSRRequirement", MSRRequirementSchema);

export default MSRRequirement;
