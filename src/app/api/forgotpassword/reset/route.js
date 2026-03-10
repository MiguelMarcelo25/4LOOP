export const dynamic = "force-dynamic";
import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";

export async function POST(req) {
  try {
    await connectMongoDB();
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword)
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user || user.resetCode !== code)
      return NextResponse.json({ error: "Invalid reset code." }, { status: 400 });

    if (new Date() > user.resetExpiry)
      return NextResponse.json({ error: "Code expired." }, { status: 400 });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = null;
    user.resetExpiry = null;
    await user.save();

    return NextResponse.json({ msg: "✅ Password successfully reset." }, { status: 200 });
  } catch (error) {
    console.error("reset error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

