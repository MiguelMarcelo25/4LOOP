import connectMongoDB from "@/lib/ConnectMongodb";
import MSRRequirement from "@/models/MSRRequirement";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/Auth";

export async function PUT(request, { params }) {
  await connectMongoDB();
  const { id } = params;

  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { label, isActive } = await request.json();
    
    const updateData = {};
    if (label !== undefined) updateData.label = label;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await MSRRequirement.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updated) {
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("MSR update error:", err);
    return NextResponse.json({ error: "Failed to update MSR requirement" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  await connectMongoDB();
  const { id } = params;

  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hard delete or soft delete? Let's use soft delete for safety (isActive = false)
    // Actually, hard delete if it's not being used?
    // Let's stick with isActive = false as seen in the GET handler filter
    const updated = await MSRRequirement.findByIdAndUpdate(id, { isActive: false }, { new: true });
    
    if (!updated) {
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Requirement deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("MSR delete error:", err);
    return NextResponse.json({ error: "Failed to delete MSR requirement" }, { status: 500 });
  }
}
