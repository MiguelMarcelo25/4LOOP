import connectMongoDB from "@/lib/ConnectMongodb";
import MSRRequirement from "@/models/MSRRequirement";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/Auth";

export async function GET() {
  await connectMongoDB();

  try {
    let requirements = await MSRRequirement.find({ isActive: true }).sort({ createdAt: 1 }).lean();
    
    // Seed defaults if empty
    if (requirements.length === 0) {
      const defaults = [
        { label: "Health Certificate" },
        { label: "Pest Control Contract / Agreement" },
        { label: "Applicable Pest Control Method" },
        { label: "License of Embalmer" },
        { label: "FDA - License to Operate" },
        { label: "Food Safety Compliance Officer (FSCO)" },
        { label: "DOH License / Accreditation" },
        { label: "Manufacturers/Distributors of Excreta/Sewage" },
        { label: "Clearance From Social Hygiene Clinic" },
        { label: "Permit to Operate" },
        { label: "Material Information Data Sheet" },
        { label: "Swab Test Result of Equipments & Rooms" },
        { label: "Certificate of Potability of Drinking Water" },
        { label: "For Water Refilling Station" },
        { label: "Others" },
      ];
      await MSRRequirement.insertMany(defaults);
      requirements = await MSRRequirement.find({ isActive: true }).sort({ createdAt: 1 }).lean();
    }

    return NextResponse.json(requirements, { status: 200 });
  } catch (err) {
    console.error("MSR fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch MSR requirements" }, { status: 500 });
  }
}

export async function POST(request) {
  await connectMongoDB();

  try {
    const session = await getSession();
    if (!session || session.user.role !== "officer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { label } = await request.json();
    if (!label) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }

    const newReq = await MSRRequirement.create({
      label,
      createdBy: session.user.id,
    });

    return NextResponse.json(newReq, { status: 201 });
  } catch (err) {
    console.error("MSR create error:", err);
    return NextResponse.json({ error: "Failed to create MSR requirement" }, { status: 500 });
  }
}
