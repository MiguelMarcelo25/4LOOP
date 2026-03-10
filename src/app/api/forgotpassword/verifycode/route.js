export const dynamic = "force-dynamic";
import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import User from "@/models/User";

export async function POST(req) {
  try {
    await connectMongoDB();
    const { email, code } = await req.json();

    if (!email || !code)
      return NextResponse.json({ error: "Missing email or code." }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user || user.resetCode !== code)
      return NextResponse.json({ error: "Invalid reset code." }, { status: 400 });

    if (new Date() > user.resetExpiry)
      return NextResponse.json({ error: "Code expired." }, { status: 400 });

    return NextResponse.json({ msg: "✅ Code verified." }, { status: 200 });
  } catch (error) {
    console.error("verifycode error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

