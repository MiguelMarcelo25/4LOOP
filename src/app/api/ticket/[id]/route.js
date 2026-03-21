import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import Ticket from "@/models/Ticket";
import Business from "@/models/Business";
import User from "@/models/User";
import Violation from "@/models/Violation";
import Notification from "@/models/Notification"; // 🟢 NEW
import { getSession } from "@/lib/Auth";

// 🟢 GET Ticket (with inspection history)
export async function GET(request, { params }) {
  await connectMongoDB();

  try {
    const { id } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1️⃣ Find the current ticket
    const ticket = await Ticket.findById(id)
      .populate("business", "businessName bidNumber businessType contactPerson businessAddress")
      .populate("officerInCharge", "fullName email")
      .lean();

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // 2️⃣ Get all previous inspection records for this same business
    const inspectionRecords = await Ticket.find({ business: ticket.business._id })
      .sort({ createdAt: -1 })
      .populate("officerInCharge", "fullName email")
      .lean();

    // 3️⃣ Combine them in one response
    const enriched = {
      ...ticket,
      inspectionRecords, // ✅ include all inspection history for autofill
    };

    return NextResponse.json(enriched, { status: 200 });
  } catch (err) {
    console.error("Ticket fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch ticket", details: err.message },
      { status: 500 }
    );
  }
}

// 🟡 UPDATE Ticket
export async function PUT(request, { params }) {
  await connectMongoDB();

  try {
    const { id } = await params;
    const body = await request.json();
    const { inspectionStatus, inspectionDate, remarks, inspectionChecklist } = body;

    const session = await getSession();
    const officerId = session?.user?.id;

    if (!officerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticket = await Ticket.findById(id).populate("business");

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // 🟠 Cancel inspection (only if pending)
    if (inspectionStatus === "none") {
      if (ticket.inspectionStatus !== "pending") {
        return NextResponse.json(
          { error: "Only pending inspections can be cancelled" },
          { status: 400 }
        );
      }
      ticket.inspectionStatus = "none";
    }

    // 🟡 Save/update — set to pending only when user saves
    if (inspectionStatus === "pending") {
      ticket.inspectionStatus = "pending";
      if (inspectionDate) ticket.inspectionDate = new Date(inspectionDate);
      if (remarks !== undefined) ticket.remarks = remarks;
    }

    // 🟢 COMPLETION FLOW
    if (inspectionStatus === "completed") {
      const year = new Date().getFullYear();
      const start = new Date(`${year}-01-01T00:00:00Z`);
      const end = new Date(`${year}-12-31T23:59:59Z`);

      const completedThisYear = await Ticket.countDocuments({
        business: ticket.business._id,
        inspectionStatus: "completed",
        createdAt: { $gte: start, $lte: end },
        _id: { $ne: ticket._id },
      });

      if (completedThisYear >= 2) {
        return NextResponse.json(
          { error: "Maximum of 2 completed inspections per year reached." },
          { status: 400 }
        );
      }

      ticket.inspectionStatus = "completed";
      if (inspectionDate) ticket.inspectionDate = new Date(inspectionDate);
      if (remarks !== undefined) ticket.remarks = remarks;

      if (inspectionChecklist) {
        ticket.inspectionChecklist = {
          ...inspectionChecklist,
          healthCertificates: {
            actualCount: Number(inspectionChecklist?.healthCertificates?.actualCount) || 0,
            withCert: Number(inspectionChecklist?.healthCertificates?.withCert) || 0,
            withoutCert: Number(inspectionChecklist?.healthCertificates?.withoutCert) || 0,
          },
        };
        ticket.markModified("inspectionChecklist");
      }

      ticket.inspectionNumber = completedThisYear + 1;
    }

    // ✅ Save the ticket first
    await ticket.save();

    // 🟢 Create notification if inspection completed
    if (ticket.inspectionStatus === "completed") {
      try {
        await Notification.create({
          user: ticket.business.businessAccount,
          business: ticket.business._id,
          ticket: ticket._id,
          message: `Your business "${ticket.business.businessName}" has completed its inspection.`,
          type: "inspection_completed",
          link: `/businessaccount/tickets/${ticket._id}`,
        });
      } catch (notifErr) {
        console.error("⚠️ Failed to create completion notification:", notifErr);
      }
    }

    // ✅ Populate before returning
    const populatedTicket = await ticket.populate([
      { path: "business", select: "businessName bidNumber businessType contactPerson businessAddress" },
      { path: "officerInCharge", select: "fullName email" },
    ]);

    return NextResponse.json(
      { msg: "Ticket updated", ticket: populatedTicket },
      { status: 200 }
    );
  } catch (err) {
    console.error("Ticket update error:", err);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

// 🔴 DELETE Ticket
export async function DELETE(request, { params }) {
  await connectMongoDB();

  try {
    const { id } = await params;
    const session = await getSession();
    const officerId = session?.user?.id;

    if (!officerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticket = await Ticket.findByIdAndDelete(id);

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ msg: "Ticket deleted" }, { status: 200 });
  } catch (err) {
    console.error("Ticket delete error:", err);
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
