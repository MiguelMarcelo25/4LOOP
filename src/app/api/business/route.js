export const dynamic = "force-dynamic";
import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import Business from "@/models/Business";
import Ticket from "@/models/Ticket";
import { getSession } from "@/lib/Auth";
import { Types } from "mongoose";

export async function GET(request) {
  await connectMongoDB();

  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { role, id: userId } = session.user;
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const requestedStatus = String(queryParams.status || "").trim().toLowerCase();

    if (role !== "officer") {
      delete queryParams.businessAccount;
      delete queryParams._id;
      delete queryParams.email;
    }

    let filter = {};
    if (role === "business") {
      filter = { ...queryParams, businessAccount: userId };
    } else if (role === "officer") {
      if (requestedStatus === "draft") {
        return NextResponse.json([], { status: 200 });
      }
      filter = requestedStatus
        ? { ...queryParams }
        : { ...queryParams, status: { $ne: "draft" } };
    } else if (role === "admin") {
      filter = { ...queryParams };
    } else {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }


    const businesses = await Business.find(filter).lean();
    const currentYear = new Date().getFullYear();

    const enriched = await Promise.all(
      businesses.map(async (b) => {
        const inspectionRecords = await Ticket.find({ business: b._id })
          .sort({ createdAt: -1 })
          .populate("officerInCharge", "fullName email")
          .populate("violations")
          .lean();

        const latestTicket = inspectionRecords[0] || null;

        const inspectionCountThisYear = await Ticket.countDocuments({
          business: b._id,
          inspectionStatus: "completed",
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        });

        // ✅ Compute sanitation permit status
        const now = new Date();
        const yearEnd = new Date(now.getFullYear(), 11, 31); // Dec 31
        const graceEnd = new Date(now.getFullYear() + 1, 0, 15); // Jan 15 next year

        let permitStatus = "-";
        if (b.sanitaryPermitIssuedAt) {
          const issuedYear = new Date(b.sanitaryPermitIssuedAt).getFullYear();
          if (issuedYear === currentYear && now <= yearEnd) {
            permitStatus = "valid";
          } else if (issuedYear === currentYear && now > yearEnd && now <= graceEnd) {
            permitStatus = "in grace period";
          } else {
            permitStatus = "expired";
          }
        }

        return {
          ...b,
          inspectionStatus: latestTicket ? latestTicket.inspectionStatus : "none",
          ticketId: latestTicket ? latestTicket._id : null,
          inspectionCountThisYear,
          recordedViolation: latestTicket?.violation || "-",
          checklist: latestTicket?.checklist || null,
          permitStatus,
          inspectionRecords, // ✅ returning all inspection records
        };
      })
    );

    return NextResponse.json(enriched, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching businesses:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  await connectMongoDB();

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, id: userId } = session.user;
  if (role !== "business") return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const {
    bidNumber = null,
    businessNickname = null,
    businessName = null,
    businessEstablishment = null,
    businessType = null,
    businessAddress = null,
    landmark = null,
    contactPerson = null,
    contactNumber = null,
    onlineRequest = null,
    requestType = null,
    remarks = null,
    status = null,
    requirements = null,
    sanitaryPermitChecklist = [],
    healthCertificateChecklist = [],
    msrChecklist = [],
    sanitaryPermitIssuedAt = null, // ✅ existing
    orDateHealthCert = null,       // ✅ add this
    orNumberHealthCert = null,     // ✅ add this
    healthCertSanitaryFee = null,  // ✅ add this
    healthCertFee = null,           // ✅ add this
    declaredPersonnel = null,
    declaredPersonnelDueDate = null,
    healthCertificates = null,
    healthCertBalanceToComply = null,
    healthCertDueDate = null,
    businessDocuments = [],
    permitDocuments = [],
    personnelDocuments = [],
  } = await request.json();

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

  const sanitaryPermitIssuedDate = toNullableDate(sanitaryPermitIssuedAt);
  const orDateHealthCertValue = toNullableDate(orDateHealthCert);
  const healthCertSanitaryFeeValue = toNullableNumber(healthCertSanitaryFee);
  const healthCertFeeValue = toNullableNumber(healthCertFee);
  const declaredPersonnelValue = toNullableNumber(declaredPersonnel);
  const declaredPersonnelDueDateValue = toNullableDate(declaredPersonnelDueDate);
  const healthCertificatesValue = toNullableNumber(healthCertificates);
  const healthCertBalanceToComplyValue = toNullableNumber(
    healthCertBalanceToComply,
  );
  const healthCertDueDateValue = toNullableDate(healthCertDueDate);


  const noRequestStatus = status || "draft";

  if (bidNumber) {
    const existing = await Business.findOne({ bidNumber });
    if (existing) {
      return NextResponse.json({ error: "Bid number already exists" }, { status: 409 });
    }
  }

  const activeStatuses = ["submitted", "pending", "pending2", "pending3", "pending4"];
  if (onlineRequest && activeStatuses.includes(noRequestStatus)) {
    const existingRequest = await Business.findOne({
      businessAccount: userId,
      onlineRequest: true,
      status: { $in: activeStatuses },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "🚫 There is already an ongoing sanitation request for this business." },
        { status: 409 }
      );
    }
  }

  const businessQuery = {
    businessAccount: new Types.ObjectId(userId),
  };

  if (bidNumber) businessQuery.bidNumber = bidNumber;
  if (businessNickname) businessQuery.businessNickname = businessNickname;
  if (businessName) businessQuery.businessName = businessName;
  if (businessEstablishment) businessQuery.businessEstablishment = businessEstablishment;
  if (businessType) businessQuery.businessType = businessType;
  if (businessAddress) businessQuery.businessAddress = businessAddress;
  if (landmark) businessQuery.landmark = landmark;
  if (contactPerson) businessQuery.contactPerson = contactPerson;
  if (contactNumber) businessQuery.contactNumber = contactNumber;
  if (onlineRequest) businessQuery.onlineRequest = onlineRequest;
  if (requestType) businessQuery.requestType = requestType;
  if (remarks) businessQuery.remarks = remarks;
  if (noRequestStatus) businessQuery.status = noRequestStatus;
  if (requirements) businessQuery.requirements = requirements;
  if (sanitaryPermitIssuedDate)
    businessQuery.sanitaryPermitIssuedAt = sanitaryPermitIssuedDate;

  if (sanitaryPermitChecklist?.length > 0)
    businessQuery.sanitaryPermitChecklist = sanitaryPermitChecklist;

  if (healthCertificateChecklist?.length > 0)
    businessQuery.healthCertificateChecklist = healthCertificateChecklist;

  if (msrChecklist?.length > 0)
    businessQuery.msrChecklist = msrChecklist;


  if (orDateHealthCertValue) businessQuery.orDateHealthCert = orDateHealthCertValue;
  if (orNumberHealthCert) businessQuery.orNumberHealthCert = orNumberHealthCert;
  if (healthCertSanitaryFeeValue !== null)
    businessQuery.healthCertSanitaryFee = healthCertSanitaryFeeValue;
  if (healthCertFeeValue !== null) businessQuery.healthCertFee = healthCertFeeValue;

  if (declaredPersonnelValue !== null)
    businessQuery.declaredPersonnel = declaredPersonnelValue;
  if (declaredPersonnelDueDateValue)
    businessQuery.declaredPersonnelDueDate = declaredPersonnelDueDateValue;
  if (healthCertificatesValue !== null)
    businessQuery.healthCertificates = healthCertificatesValue;
  if (healthCertBalanceToComplyValue !== null)
    businessQuery.healthCertBalanceToComply = healthCertBalanceToComplyValue;
  if (healthCertDueDateValue) businessQuery.healthCertDueDate = healthCertDueDateValue;

  if (businessDocuments?.length > 0) businessQuery.businessDocuments = businessDocuments;
  if (permitDocuments?.length > 0) businessQuery.permitDocuments = permitDocuments;
  if (personnelDocuments?.length > 0) businessQuery.personnelDocuments = personnelDocuments;

  try {
    const business = new Business(businessQuery);
    await business.save();
    return NextResponse.json(business, { status: 200 });
  } catch (err) {
    console.error("❌ Error saving business:", err.message);
    console.error("📦 Payload:", businessQuery);
    return NextResponse.json({ error: "Failed to save business" }, { status: 500 });
  }
}

