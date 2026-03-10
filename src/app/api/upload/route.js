export const dynamic = "force-dynamic";
import connectMongoDB from "@/lib/ConnectMongodb";
import User from "@/models/User";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(request) {
  await connectMongoDB();

  const { userId, imageData } = await request.json();

  if (!userId || !imageData) {
    return NextResponse.json({ error: "Missing user ID or image data." }, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ error: "Invalid user ID format." }, { status: 400 });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: imageData },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Profile picture updated successfully.",
      user: updatedUser,
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Profile picture update error:", error);
    return NextResponse.json({ error: "Database error while updating profile picture." }, { status: 500 });
  }
}

