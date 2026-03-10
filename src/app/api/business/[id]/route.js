export const dynamic = "force-dynamic";
import Notification from "@/models/Notification";
import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import Business from "@/models/Business";
import Ticket from "@/models/Ticket";
import mongoose from "mongoose";
import { getSession } from "@/lib/Auth";
import User from "@/models/User";

// 🔹 Helper function to locate a business
async function findBusiness(id, userId, role) {
  const isOid = mongoose.Types.ObjectId.isValid(id);

  if (role === "business") {
    const q = { $or: [], businessAccount: userId };
    if (isOid) q.$or.push({ _id: id });
    q.$or.push({ bidNumber: id });
    return Business.findOne(q).lean();
  }

  if (role === "officer") {
    return isOid
      ? Business.findById(id).lean()
      : Business.findOne({ bidNumber: id }).lean();
  }

  return null;
}

// 🔹 GET handler (with inspection history)
export async function GET(request, { params }) {
  await connectMongoDB();

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { role, id: userId } = session.user;

  try {
    const business = await findBusiness(id, userId, role);
    if (!business) {
      return NextResponse.json(
        { error: "You have no business like that." },
        { status: 404 }
      );
    }

    // ✅ Populate officer info if assigned
    // ✅ Populate both officer and business owner info (email + name)
    let populatedBusiness = await Business.populate(business, [
      { path: "officerInCharge", select: "fullName email" },
      { path: "businessAccount", select: "email" },
    ]);


    const currentYear = new Date().getFullYear();

    // 🟢 Get all inspection records for this business
    const inspectionRecords = await Ticket.find({ business: business._id })
      .sort({ createdAt: -1 })
      .populate("officerInCharge", "fullName email")
      .lean();

    const latestTicket = inspectionRecords[0] || null;

    // 🧮 Count how many were completed this year
    const inspectionCountThisYear = await Ticket.countDocuments({
      business: business._id,
      inspectionStatus: "completed",
      createdAt: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`),
      },
    });

    // 🧾 Permit validity computation
    const now = new Date();
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    const graceEnd = new Date(now.getFullYear() + 1, 0, 15);
    let permitStatus = "unknown";

    if (business.sanitaryPermitIssuedAt) {
      const issuedYear = new Date(business.sanitaryPermitIssuedAt).getFullYear();
      if (issuedYear === currentYear && now <= yearEnd) {
        permitStatus = "valid";
      } else if (issuedYear === currentYear && now > yearEnd && now <= graceEnd) {
        permitStatus = "in grace period";
      } else {
        permitStatus = "expired";
      }
    }

    // 🧠 Return full data with all inspection history
    const enriched = {
      ...populatedBusiness,
      inspectionStatus: latestTicket ? latestTicket.inspectionStatus : "none",
      ticketId: latestTicket ? latestTicket._id : null,
      inspectionCountThisYear,
      recordedViolation: latestTicket?.violation || "-",
      checklist: latestTicket?.inspectionChecklist || null,
      permitStatus,
      inspectionRecords,
    };

    return NextResponse.json(enriched, { status: 200 });
  } catch (err) {
    console.error("GET error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }

}
export async function PUT(request, { params }) {
  await connectMongoDB();

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { id: userId, role } = session.user;
  const body = await request.json();
  const updateFields = {};
  const hasBodyKey = (key) => Object.prototype.hasOwnProperty.call(body, key);
  const isBlankValue = (value) =>
    value === null || value === undefined || value === "";
  const toNullableNumber = (value) => {
    if (isBlankValue(value)) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const toNullableDate = (value) => {
    if (isBlankValue(value)) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const assignNullableNumber = (sourceKey, targetKey = sourceKey) => {
    if (!hasBodyKey(sourceKey)) return;
    const raw = body[sourceKey];
    const parsed = toNullableNumber(raw);
    if (parsed !== null || isBlankValue(raw)) updateFields[targetKey] = parsed;
  };
  const assignNullableDate = (sourceKey, targetKey = sourceKey) => {
    if (!hasBodyKey(sourceKey)) return;
    const raw = body[sourceKey];
    const parsed = toNullableDate(raw);
    if (parsed || isBlankValue(raw)) updateFields[targetKey] = parsed;
  };

  console.log("🧾 PUT BODY RECEIVED:", JSON.stringify(body, null, 2));

  // 🔹 Basic business info
  if (body.newRequestType) updateFields.requestType = body.newRequestType;
  if (body.newBidNumber) updateFields.bidNumber = body.newBidNumber;
  if (body.newBusinessName) updateFields.businessName = body.newBusinessName;
  if (body.newBusinessNickname) updateFields.businessNickname = body.newBusinessNickname;
  if (body.newBusinessEstablishment) updateFields.businessEstablishment = body.newBusinessEstablishment;
  if (body.newBusinessType) updateFields.businessType = body.newBusinessType;
  if (body.newBusinessAddress) updateFields.businessAddress = body.newBusinessAddress;
  if (body.newStatus) updateFields.status = body.newStatus;
  if (body.newContactPerson) updateFields.contactPerson = body.newContactPerson;
  if (body.newContactNumber) updateFields.contactNumber = body.newContactNumber;
  if (body.newLandmark) updateFields.landmark = body.newLandmark;
  if (body.newRemarks) updateFields.remarks = body.newRemarks;
  if (body.businessDocuments) updateFields.businessDocuments = body.businessDocuments;
  if (body.permitDocuments) updateFields.permitDocuments = body.permitDocuments;
  if (body.personnelDocuments) updateFields.personnelDocuments = body.personnelDocuments;

  if (body.officerInCharge) updateFields.officerInCharge = body.officerInCharge;

  // 🔹 Fee & date fields
  assignNullableDate("orDateHealthCert");
  if (hasBodyKey("orNumberHealthCert"))
    updateFields.orNumberHealthCert = body.orNumberHealthCert || null;
  assignNullableNumber("healthCertSanitaryFee");
  assignNullableNumber("healthCertFee");
  assignNullableNumber("declaredPersonnel");
  assignNullableDate("declaredPersonnelDueDate");
  assignNullableNumber("healthCertificates");
  assignNullableNumber("healthCertBalanceToComply");
  assignNullableDate("healthCertDueDate");

  // 🔹 Normalize checklist items (handles both arrays and objects from form state)
  const normalize = (arr) => {
    const list = Array.isArray(arr) ? arr : [];
    return list
      .filter((i) => i && i.label)
      .map((i, idx) => ({
        id:
          typeof i.id === "string" && i.id.trim() !== ""
            ? i.id.trim()
            : `custom_${Date.now()}_${idx}`,
        label: i.label.trim(),
        ...(i.dueDate ? { dueDate: new Date(i.dueDate) } : {}),
      }));
  };

  try {
    // ✅ Check role-based access
    const business = await findBusiness(id, userId, role);
    if (!business) {
      return NextResponse.json(
        { error: "Unauthorized or business not found." },
        { status: 403 }
      );
    }

    // ✅ Always update checklists if provided
    if (body.sanitaryPermitChecklist)
      updateFields.sanitaryPermitChecklist = normalize(body.sanitaryPermitChecklist);

    if (body.healthCertificateChecklist)
      updateFields.healthCertificateChecklist = normalize(body.healthCertificateChecklist);

    if (body.msrChecklist)
      updateFields.msrChecklist = normalize(body.msrChecklist);

    // ✅ Update tracking info
    updateFields.lastChecklistUpdatedBy = userId;
    updateFields.lastChecklistUpdatedAt = new Date();

    // ✅ Apply update
    const updated = await Business.findByIdAndUpdate(
      business._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .populate("officerInCharge", "fullName email")
      .populate("businessAccount", "email fullName") // ✅ Ensure businessAccount (user) is populated
      .lean();

    // 🔹 1️⃣ If approved — send notification + email
    if (updateFields.status === "completed" && updated?.businessAccount) {
      const user = updated.businessAccount;
      const userId = user._id;
      const email = user.email;
      const businessName = updated.businessName;

      // 🔔 Create Notification
      await Notification.create({
        user: userId,
        title: "Permit Approved 🎉",
        message: `Your permit for "${businessName}" has been approved. You may now access it in your dashboard.`,
        type: "permit_released",
        business: updated._id,
        isRead: false,
        isDeleted: false,
      });

      // 📧 Send Email
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_URL_AND_PORT || "http://localhost:3000";


        console.log("📧 Sending approval email to:", email);
        console.log("📨 Email API URL:", `${baseUrl}/api/notifications/email`);

        const emailRes = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/notifications/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            subject: "Your Business Permit Has Been Approved 🎉",
            body: `
              <p>Hello,</p>
              <p>We are pleased to inform you that your permit request for <strong>${businessName}</strong> has been approved.</p>
              <p>Please proceed to the Sanitation Department and claim your permit.</p>
              <br/>
              <p>Thank you for your compliance and cooperation.</p>
              <p><strong>Pasig Sanitation Office</strong></p>
            `,
          }),
        });

        const emailResult = await emailRes.json();
        if (!emailRes.ok) {
          console.error("❌ Email failed to send:", emailResult);
        } else {
          console.log("✅ Email sent successfully:", emailResult);
        }
      } catch (emailErr) {
        console.error("📨 Email sending failed:", emailErr);
      }
    }

    // ✅ Return response
    return NextResponse.json({ msg: "Business updated", business: updated }, { status: 200 });
  } catch (err) {
    console.error("❌ PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update business", details: err.message },
      { status: 500 }
    );
  }
}





export async function DELETE(request, { params }) {
  await connectMongoDB();

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { role, id: userId } = session.user;

  try {
    const business = await findBusiness(id, userId, role);
    if (!business) {
      return NextResponse.json(
        { error: "You have no business like that." },
        { status: 404 }
      );
    }

    // ✅ Restrict delete to DRAFT status
    if (business.status !== "draft") {
      return NextResponse.json(
        { error: "Only businesses with 'draft' status can be deleted." },
        { status: 403 }
      );
    }

    // ✅ Permanently delete the document
    await Business.deleteOne({ _id: business._id });

    return NextResponse.json(
      { message: "Business deleted permanently." },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete business", details: err.message },
      { status: 500 }
    );
  }
}
