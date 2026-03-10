export const dynamic = "force-dynamic";
import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { login } from "@/lib/Auth";

export async function POST(request) {
  await connectMongoDB();

  try {
    const { email, password } = await request.json();

    // 🔍 Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`Login failed: user not found for email ${email}`);
      return NextResponse.json(
        { success: false, error: "Invalid credentials." },
        { status: 401 }
      );
    }

    // 🚫 Block if email not verified
    if (!user.verified) {
      console.warn(`Login blocked: email not verified for ${email}`);
      return NextResponse.json(
        {
          success: false,
          error: "Email not verified. Please verify your account before logging in.",
        },
        { status: 403 }
      );
    }

    // 🚫 Block if officer account is disabled
    if (user.role === "officer" && user.accountDisabled === true) {
      console.warn(`Login blocked: officer account locked for ${email}`);
      return NextResponse.json(
        {
          success: false,
          error: "Your account has been locked by the admin.",
        },
        { status: 403 }
      );
    }

    // 🔐 Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`Login failed: password mismatch for email ${email}`);
      return NextResponse.json(
        { success: false, error: "Invalid credentials." },
        { status: 401 }
      );
    }

    // ✅ Set session cookie
    await login(user);
    console.log(`✅ Login successful for ${email}`);

    // 🧼 Send safe user info
    const safeUser = {
      _id: user._id,
      email: user.email,
      role: user.role,
      accountDisabled: user.accountDisabled || false,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Login successful.",
        user: safeUser,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Login error:", err);
    return NextResponse.json(
      { success: false, error: "Login failed due to a server error." },
      { status: 500 }
    );
  }
}

