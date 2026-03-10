import Violation from "@/models/Violation";
import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import Ticket from "@/models/Ticket";
import Business from "@/models/Business";
import Notification from "@/models/Notification"; // 🟢 NEW
import { getSession } from "@/lib/Auth";
import mongoose from "mongoose";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// =========================
// GET /api/ticket
// =========================
export async function GET(request) {
  await connectMongoDB();

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = session.user;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const businessId = searchParams.get("businessId");
    const year = searchParams.get("year");

    const query = {};

    if (status) query.inspectionStatus = status;

    if (businessId) {
      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
      }
      query.business = new mongoose.Types.ObjectId(businessId);
    } else if (role === "business") {
      query.businessAccount = userId;
    }

    if (year) {
      const start = new Date(`${year}-01-01T00:00:00Z`);
      const end = new Date(`${year}-12-31T23:59:59Z`);
      query.createdAt = { $gte: start, $lte: end };
    }

    if (!["officer", "admin", "business"].includes(role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .populate(
        "business",
        "businessName bidNumber businessType contactPerson businessAddress requestType"
      )
      .populate("officerInCharge", "fullName email")
      .populate({
        path: "violations",
        select: "code ordinanceSection description penalty violationStatus createdAt",
      })
      .lean();

    return NextResponse.json(tickets, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching tickets:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// =========================
// POST /api/ticket
// =========================
export async function POST(request) {
  await connectMongoDB();

  try {
    const body = await request.json();
    const {
      bidNumber,
      businessId,
      inspectionType,
      violationType,
      violation,
      remarks,
      inspectionDate,
      inspectionChecklist,
      inspectionStatus,
    } = body;

    const session = await getSession();
    if (!session || !["officer", "admin"].includes(session.user?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: officerId } = session.user;

    // ✅ Find the business
    let business =
      (businessId && (await Business.findById(businessId))) ||
      (bidNumber && (await Business.findOne({ bidNumber })));

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // ✅ Check inspection limits per year
    const currentYear = new Date().getFullYear();
    const start = new Date(`${currentYear}-01-01T00:00:00Z`);
    const end = new Date(`${currentYear}-12-31T23:59:59Z`);

    const completedInspectionsThisYear = await Ticket.countDocuments({
      business: business._id,
      inspectionStatus: "completed",
      createdAt: { $gte: start, $lte: end },
    });

    if (inspectionStatus === "completed" && completedInspectionsThisYear >= 2) {
      return NextResponse.json(
        { error: `Maximum of 2 completed inspections per year reached for ${business.businessName}.` },
        { status: 400 }
      );
    }

    // ✅ Generate ticket number
    const latestTicket = await Ticket.findOne({
      ticketNumber: { $regex: `^TKT-${currentYear}-` },
    }).sort({ ticketNumber: -1 });

    let nextNumber = 1;
    if (latestTicket) {
      const lastTicketNumber = latestTicket.ticketNumber;
      const parts = lastTicketNumber.split("-");
      if (parts.length === 3) {
        nextNumber = parseInt(parts[2], 10) + 1;
      }
    }
    const ticketNumber = `TKT-${currentYear}-${String(nextNumber).padStart(3, "0")}`;

    const inspectionNumber = completedInspectionsThisYear + 1;

    const typeToUse = inspectionNumber === 1 ? "routine" : "reinspection";

    // ✅ Normalize checklist structure
    const checklist = {
      sanitaryPermit: inspectionChecklist?.sanitaryPermit ?? "",
      healthCertificates: {
        actualCount: Number(inspectionChecklist?.healthCertificates?.actualCount) || 0,
        withCert: Number(inspectionChecklist?.healthCertificates?.withCert) || 0,
        withoutCert: Number(inspectionChecklist?.healthCertificates?.withoutCert) || 0,
      },
      certificateOfPotability: inspectionChecklist?.certificateOfPotability ?? "",
      pestControl: inspectionChecklist?.pestControl ?? "",
      sanitaryOrder01:
        inspectionChecklist?.sanitaryOrder01 ?? inspectionChecklist?.sanitaryOrder1 ?? "",
      sanitaryOrder02:
        inspectionChecklist?.sanitaryOrder02 ?? inspectionChecklist?.sanitaryOrder2 ?? "",
    };

    // ✅ Create the ticket
    const ticket = await Ticket.create({
      ticketNumber,
      business: business._id,
      businessAccount: business.businessAccount,
      officerInCharge: officerId,
      inspectionDate: inspectionDate ? new Date(inspectionDate) : new Date(),
      inspectionType: inspectionType || typeToUse,
      violationType: violationType || "sanitation",
      violation,
      remarks,
      inspectionChecklist: checklist,
      inspectionStatus: inspectionStatus || "pending",
      resolutionStatus: "none",
      inspectionNumber,
    });

    // ✅ Populate for response
    const populatedTicket = await ticket.populate([
      {
        path: "business",
        select: "businessName bidNumber businessType contactPerson businessAddress requestType businessAccount"
      },
      {
        path: "businessAccount",
        select: "email fullName"
      }
    ]);

    const biz = populatedTicket.business;
    const account = populatedTicket.businessAccount;
    const formattedDate = new Date(ticket.inspectionDate).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // ✅ Create Notification for business owner
    try {
      const recipientId = ticket.businessAccount || biz.businessAccount || account?._id;
      if (recipientId) {
        await Notification.create({
          user: recipientId, // recipient
          business: biz._id,
          ticket: ticket._id,
          title: "Inspection Scheduled",
          message: `A new inspection (${ticketNumber}) has been scheduled for your business "${biz.businessName}" on ${formattedDate}.`,
          type: "inspection_created",
          link: `/businessaccount/tickets/${ticket._id}`,
        });
      }
    } catch (notifErr) {
      console.error("⚠️ Notification creation failed:", notifErr);
    }

    // ✅ Send Email Notification
    if (account?.email) {
      try {
        await resend.emails.send({
          from: "Pasig Sanitation <noreply@pasigsanitation-project.site>",
          to: account.email,
          subject: `Scheduled Inspection for ${biz.businessName}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
              <h2 style="color: #004AAD; margin-bottom: 10px;">Inspection Scheduled</h2>
              <p>Dear ${biz.contactPerson || "Business Owner"},</p>
              <p>
                A new inspection has been scheduled for your business
                <strong>${biz.businessName}</strong> on
                <strong>${formattedDate}</strong>.
              </p>
              <p>Please ensure that your premises and relevant documents are ready for inspection.</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
              <p style="font-size: 13px; color: #777;">
                This is an automated message from <strong>Pasig Sanitation</strong>. Please do not reply to this email.
              </p>
            </div>
          `,
        });
        console.log(`✅ Email sent to ${account.email}`);
      } catch (emailErr) {
        console.error("⚠️ Email sending failed:", emailErr);
      }
    }

    return NextResponse.json(
      { msg: "Ticket created successfully", ticket: populatedTicket },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ Ticket creation error:", err);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
