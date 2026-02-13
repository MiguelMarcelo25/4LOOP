// scripts/seedAdmin.js
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Load .env.local or .env BEFORE any other imports
dotenv.config({ path: resolve(__dirname, "../.env.local") });
dotenv.config({ path: resolve(__dirname, "../.env") });

console.log("Loaded MONGODB_URI:", process.env.MONGODB_URI); // debug

// ✅ Now import after env is ready
const { default: connectMongoDB } =
  await import("../src/lib/ConnectMongodb.js");
const { default: User } = await import("../src/models/User.js");
import bcrypt from "bcryptjs";

async function seedAdmin() {
  await connectMongoDB();

  const existing = await User.findOne({ email: "admin@admin.com" });
  if (existing) {
    console.log("✅ Admin already exists");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash("123123123123", 10);

  await User.create({
    email: "admin@admin.com",
    password: hashedPassword,
    role: "admin",
    verified: true,
  });

  console.log("✅ Admin created successfully");
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌ Error seeding admin:", err);
  process.exit(1);
});
