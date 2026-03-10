export const dynamic = "force-dynamic";
import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import Notification from "@/models/Notification";
import { getSession } from "@/lib/Auth";

// 🟢 GET Notifications (for logged-in business account)
export async function GET(request, { params }) {
  await connectMongoDB();

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, id: userId } = session.user;

  // Only business users should see notifications
  if (role !== "business") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    // Fetch notifications related to this user's account
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("ticket", "inspectionStatus inspectionNumber")
      .populate("business", "businessName bidNumber")
      .lean();

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error) {
    console.error("Notification GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// 🟡 PATCH — mark notification as read
export async function PATCH(request) {
  await connectMongoDB();

  try {
    const { id } = await request.json();

    const notif = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notif) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ msg: "Notification marked as read", notif });
  } catch (error) {
    console.error("Notification PATCH error:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
