import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/ConnectMongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    await connectMongoDB();
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    
    const query = {};
    if (role) {
      query.role = role;
    }
    
    // Fetch users with the specified query and sort by newest first
    const users = await User.find(query).sort({ createdAt: -1 });
    
    // Map users to include status field derived from accountDisabled
    const formattedUsers = users.map(user => ({
      ...user.toObject(),
      status: user.accountDisabled ? 'disabled' : 'active'
    }));
    
    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectMongoDB();
    
    const body = await request.json();
    const { fullName, email, password, role, verify, status } = body;
    
    // Validate required fields
    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    
    // Validate password strength
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return NextResponse.json({
        error: "Weak password. Must include upper & lowercase letters, a number, a special character, and be at least 8 characters long."
      }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      verified: verify === true,
      accountDisabled: status === 'disabled',
      // Set default values for other fields if needed
    });
    
    return NextResponse.json({ 
      message: "User created successfully", 
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        status: newUser.accountDisabled ? 'disabled' : 'active',
        verify: newUser.verified
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
