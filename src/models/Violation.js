import mongoose, { Schema } from "mongoose";

const ViolationSchema = new Schema(
  {
    ticket: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },

    code: {
  type: String,
  enum: [
    "no_sanitary_permit",
    "no_health_certificate",
    "failure_display_sanitary",
    "failure_display_health",
    "failure_renew_sanitary",
    "failure_renew_health",
    "tampered_documents",
    "fake_documents",
    "expired_documents",
    "other",
    "pest_control_noncompliance",
    "sanitary_order_01",
    "sanitary_order_02",
    "water_potability_violation",
    "pest_control_violation",
  ],
  required: true,
},


    ordinanceSection: {
      type: String,
      default: "Ordinance No. 53, s.2022",
    },

    description: { type: String },
    penalty: { type: Number, default: 0 },
    offenseCount: { type: Number, default: 1 },

    violationStatus: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// ✅ Use ES module export (Next.js compatible)
const Violation =
  mongoose.models.Violation || mongoose.model("Violation", ViolationSchema);

export default Violation;
