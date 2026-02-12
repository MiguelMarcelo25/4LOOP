import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/ConnectMongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Send verification email via Resend
async function sendVerificationEmail(email, code) {
  try {
    await resend.emails.send({
      from: "Pasig Sanitation <noreply@pasigsanitation-project.site>",
      to: email,
      subject: "Verify Your Email - Pasig Sanitation",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Welcome to Pasig City Sanitation Online Service!</h2>
          <p>Use this code to verify your email address:</p>
          <h1 style="font-size: 24px; letter-spacing: 3px; background: #004AAD; color: white; display: inline-block; padding: 10px 20px; border-radius: 8px;">${code}</h1>
          <p>This code will expire in <strong>15 minutes</strong>.</p>
          <p>If you did not create this account, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("❌ Resend email error:", error);
    throw new Error("Failed to send verification email");
  }
}

export async function GET(request) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const query = {};
    if (role) {
      query.role = role;
    }

    // Fetch users with the specified query and sort by newest first
    const users = await User.find(query).sort({ createdAt: -1 });

    // Map users to include status field derived from accountDisabled
    const formattedUsers = users.map((user) => ({
      ...user.toObject(),
      status: user.accountDisabled ? "disabled" : "active",
    }));

    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { fullName, email, password, role, verify, status } = body;

    console.log(body);

    // Validate required fields
    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // ✅ If user exists but is NOT verified, return special 409 so frontend can prompt to resend
      if (!existingUser.verified) {
        return NextResponse.json(
          {
            error: "Email already registered",
            unverified: true,
            email: existingUser.email,
          },
          { status: 409 },
        );
      }
      // ✅ If user exists and IS verified, return normal 409
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    // Validate password strength
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return NextResponse.json(
        {
          error:
            "Weak password. Must include upper & lowercase letters, a number, a special character, and be at least 8 characters long.",
        },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Generate 6-digit verification code and 15-minute expiry
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create new user
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      verified: verify === true,
      accountDisabled: status === "disabled",
      verificationCode,
      verificationExpiry,
    });

    // ✅ Send verification email (only for self-registering users, not admin-created verified ones)
    if (!newUser.verified) {
      try {
        await sendVerificationEmail(email, verificationCode);
        console.log(`✅ Verification email sent to ${email}`);
      } catch (emailErr) {
        console.error(
          `⚠️ User created but failed to send verification email to ${email}:`,
          emailErr.message,
        );
        // User is created but email failed — they can use "Resend Code" on the verify page
      }
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        data: {
          email: newUser.email,
          verified: newUser.verified,
        },
        user: {
          _id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          status: newUser.accountDisabled ? "disabled" : "active",
          verify: newUser.verified,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
