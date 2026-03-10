export const dynamic = "force-dynamic";
import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import User from "@/models/User";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendResetEmail(email, code) {
  await resend.emails.send({
    from: "Pasig Sanitation <noreply@pasigsanitation-project.site>",
    to: email,
    subject: "Password Reset Code - Pasig Sanitation",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Password Reset Request</h2>
        <p>Use this code to reset your password:</p>
        <h1 style="font-size: 24px; letter-spacing: 3px; background: #004AAD; color: white; display: inline-block; padding: 10px 20px; border-radius: 8px;">${code}</h1>
        <p>This code will expire in <strong>15 minutes</strong>.</p>
      </div>
    `,
  });
}

export async function POST(req) {
  try {
    await connectMongoDB();
    const { email } = await req.json();

    if (!email)
      return NextResponse.json({ error: "Email is required." }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user)
      return NextResponse.json({ error: "No account found with that email." }, { status: 404 });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = resetCode;
    user.resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry
    await user.save();

    await sendResetEmail(email, resetCode);

    return NextResponse.json({ msg: "✅ Reset code sent successfully." }, { status: 200 });
  } catch (error) {
    console.error("sendcode error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

