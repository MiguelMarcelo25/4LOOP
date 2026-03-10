export const dynamic = "force-dynamic";
import connectMongoDB from "@/lib/ConnectMongodb";
import Violation from "@/models/Violation";
import Ticket from "@/models/Ticket";
import { NextResponse } from "next/server";

// 🟢 GET Violations
export async function GET(request) {
  await connectMongoDB();

  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const skip = (page - 1) * limit;

    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }

    const ticketIds = await Ticket.distinct("_id", { business: businessId });

    const violations = await Violation.find({ ticket: { $in: ticketIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(violations || [], { status: 200 });
  } catch (err) {
    console.error("Violation fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch violations" }, { status: 500 });
  }
}

// 🟡 POST Violation
export async function POST(request) {
  await connectMongoDB();

  try {
    const body = await request.json();

    const {
      ticketId,
      code,
      description,
      penalty,
      ordinanceSection,
      offenseCount,
      violationStatus,
    } = body;

    if (!ticketId || !code || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Determine penalty amount based on code if not explicitly provided
    let computedPenalty = penalty;
    if (!computedPenalty) {
      switch (code) {
        case "sanitary_permit":
        case "failure_renew_sanitary":
          computedPenalty = 2000;
          break;
        case "pest_control_noncompliance":
          computedPenalty = 2000;
          break;
        case "health_certificate_missing":
          computedPenalty = 500 * (offenseCount || 1);
          break;
        case "water_potability":
          computedPenalty = 500;
          break;
        case "msr_violation":
          computedPenalty =
            offenseCount === 1 ? 1000 : offenseCount === 2 ? 2000 : 5000;
          break;
        default:
          computedPenalty = 2000;
      }
    }

    const violation = await Violation.create({
      ticket: ticketId,
      code,
      description,
      penalty: computedPenalty,
      ordinanceSection: ordinanceSection || "Ordinance No. 53, s.2022",
      offenseCount: offenseCount || 1,
      violationStatus: violationStatus || "pending",
    });

    // Update related ticket with this violation
    await Ticket.findByIdAndUpdate(ticketId, {
      $push: { violations: violation._id },
    });

    return NextResponse.json({ message: "Violation created", violation }, { status: 201 });
  } catch (err) {
    console.error("Violation create error:", err);
    return NextResponse.json({ error: "Failed to create violation" }, { status: 500 });
  }
}

