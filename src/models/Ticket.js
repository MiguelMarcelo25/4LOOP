import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

mongoose.Promise = global.Promise;

const TicketSchema = new Schema(
  {
    ticketNumber: { type: String, unique: true, required: true }, // e.g. TKT-2025-001

    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    businessAccount: { type: Schema.Types.ObjectId, ref: "User" },

    officerInCharge: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dateReinspected: { type: Date, default: null },

    inspectionDate: { type: Date, required: true },
    inspectionType: {
      type: String,
      enum: ["routine", "follow-up", "complaint-based", "reinspection"],
      default: "routine",
    },

    violationType: {
      type: String,
      enum: ["sanitation", "waste disposal", "pest control", "structural", "other"],
      default: "sanitation",
    },

    violations: [{ type: Schema.Types.ObjectId, ref: "Violation" }],

    inspectionChecklist: {
      sanitaryPermit: {
        type: String,
        enum: ["with", "without", ""],
        default: "",
        comment: "Indicates if the establishment has a valid Sanitary Permit",
      },

      healthCertificates: {
        actualCount: { type: Number, default: 0 },
        withCert: { type: Number, default: 0 },
        withoutCert: { type: Number, default: 0 },
      },

      certificateOfPotability: {
        type: String,
        enum: ["check", "x", ""],
        default: "",
        comment: "Clean Premises and Proper Waste Disposal",
      },

      pestControl: {
        type: String,
        enum: ["check", "x", ""],
        default: "",
        comment: "Pest control compliance (presence of pest control program)",
      },

      sanitaryOrder01: {
        type: String,
        enum: ["check", "x", ""],
        default: "",
        comment: "Indicates if Sanitary Order (S.O.) #1 was issued for major violations",
      },

      sanitaryOrder02: {
        type: String,
        enum: ["check", "x", ""],
        default: "",
        comment:
          "Indicates if Sanitary Order (S.O.) #2 was issued for repeated or serious violations",
      },
    },

    findings: { type: String },
    remarks: { type: String },

    resolutionStatus: {
      type: String,
      enum: ["none", "for compliance", "resolved"],
      default: "none",
    },

    inspectionStatus: {
      type: String,
      enum: ["none", "pending", "completed"],
      default: "none",
    },

    inspectionNumber: { type: Number, default: 1 },

    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: false,
  }
);

TicketSchema.plugin(mongoosePaginate);

// ✅ Use ES module export (for Next.js compatibility)
const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
export default Ticket;
