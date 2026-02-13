import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/ConnectMongodb';
import Business from '@/models/Business';
import mongoose from 'mongoose';
import { getSession } from '@/lib/Auth';

export async function PUT(req, { params }) {
  await connectMongoDB();
  const { id } = await params;
  const body = await req.json();

  try {
    // Get the current user session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = session.user;

    // Find the business first to check ownership
    let business;
    if (mongoose.Types.ObjectId.isValid(id)) {
      business = await Business.findById(id);
    } else {
      business = await Business.findOne({ bidNumber: id });
    }

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check if business user is trying to access another user's business
    if (role === "business" && business.businessAccount.toString() !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updateFields = {
      bidNumber: body.newBidNumber,
      businessName: body.newBusinessName,
      businessNickname: body.newBusinessNickname,
      businessType: body.newBusinessType,
      businessAddress: body.newBusinessAddress,
      landmark: body.newLandmark,
      contactPerson: body.newContactPerson,
      contactNumber: body.newContactNumber,
      status: body.newStatus,
      msrChecklist: body.msrChecklist, // ✅ Allow updating MSR checklist
      updatedAt: new Date(),
    };

    // Update the business
    if (mongoose.Types.ObjectId.isValid(id)) {
      business = await Business.findByIdAndUpdate(id, updateFields, { new: true });
    } else {
      business = await Business.findOneAndUpdate({ bidNumber: id }, updateFields, { new: true });
    }

    return NextResponse.json(business, { status: 200 });
  } catch (err) {
    console.error('❌ PUT error:', err);
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  await connectMongoDB();

  const { id } = await params;

  try {
    // Get the current user session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = session.user;

    let business;

    if (mongoose.Types.ObjectId.isValid(id)) {
      business = await Business.findById(id);
    } else {
      business = await Business.findOne({ bidNumber: id });
    }

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check if business user is trying to access another user's business
    if (role === "business" && business.businessAccount.toString() !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(business, { status: 200 });
  } catch (err) {
    console.error('❌ GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 });
  }
}
