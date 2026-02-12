import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import User from "@/models/User";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(email, code) {
  try {
    await resend.emails.send({
      from: "Pasig Sanitation <noreply@pasigsanitation-project.site>", // ✅ use a verified sender domain if possible
      to: email,
      subject: "New Verification Code - Pasig Sanitation",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>New Verification Code</h2>
          <p>Use this code to verify your email address:</p>
          <h1 style="font-size: 24px; letter-spacing: 3px; background: #004AAD; color: white; display: inline-block; padding: 10px 20px; border-radius: 8px;">${code}</h1>
          <p>This code will expire in <strong>15 minutes</strong>.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Resend email error:", error);
    throw new Error("Failed to send verification email");
  }
}

export async function POST(req) {
  try {
    await connectMongoDB();
    const { email } = await req.json();

    if (!email)
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 },
      );

    const user = await User.findOne({ email });
    if (!user)
      return NextResponse.json({ error: "User not found." }, { status: 404 });

    if (user.verified)
      return NextResponse.json(
        { error: "Email already verified." },
        { status: 400 },
      );

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = newCode;
    user.verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    await sendVerificationEmail(email, newCode);

    return NextResponse.json(
      { msg: "✅ New verification code sent." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Resend-code route error:", error);
    return NextResponse.json(
      { error: "Failed to resend code." },
      { status: 500 },
    );
  }
}
