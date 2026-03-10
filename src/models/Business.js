import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

mongoose.Promise = global.Promise;

const BusinessSchema = new Schema(
  {
    bidNumber: { type: String, unique: true, sparse: true },
    businessNickname: { type: String },
    businessName: { type: String, required: true },
    businessType: { type: String, required: true },
    businessAddress: { type: String, required: true },
    landmark: { type: String },
    contactPerson: { type: String },
    contactNumber: { type: String },
    requestType: { type: String },
    remarks: { type: String },
    businessEstablishment: { type: String },
    sanitaryPermitIssuedAt: { type: Date },
    expirationDate: { type: Date },
    gracePeriodDate: { type: Date },

    officerInCharge: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    sanitaryPermitChecklist: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
      },
    ],

    healthCertificateChecklist: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
      },
    ],

    msrChecklist: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
        dueDate: { type: Date },
      },
    ],

    history: [
      {
        remarks: { type: String, required: true },
        date: { type: Date },
      },
    ],

    orDateHealthCert: { type: Date },
    orNumberHealthCert: { type: String },
    healthCertSanitaryFee: { type: Number, min: 0 },
    healthCertFee: { type: Number, min: 0 },

    declaredPersonnel: { type: Number },
    declaredPersonnelDueDate: { type: Date },
    healthCertificates: { type: Number },
    healthCertBalanceToComply: { type: Number },
    healthCertDueDate: { type: Date },

    onlineRequest: { type: Boolean, default: false },

    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "pending",
        "pending2",
        "pending3",
        "completed",
        "released",
        "expired",
      ],
      default: "draft",
    },
    // Captures the previous lifecycle state before moving to "submitted",
    // so withdraw can restore the correct status.
    statusBeforeSubmission: { type: String, default: null },
    // Snapshot of pre-submit values for renewal requests.
    // Used to restore business data when a renewal is withdrawn.
    submissionSnapshot: { type: Schema.Types.Mixed, default: null },

    businessAccount: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    businessDocuments: [
      {
        name: { type: String },
        url: { type: String },
      },
    ],
    permitDocuments: [
      {
        name: { type: String },
        url: { type: String },
      },
    ],
    personnelDocuments: [
      {
        name: { type: String },
        url: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: false,
  }
);

BusinessSchema.plugin(mongoosePaginate);

// ✅ Correct export for Next.js
export default mongoose.models.Business || mongoose.model("Business", BusinessSchema);
