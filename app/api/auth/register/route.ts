import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { hashPassword, signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { jsonError } from "@/lib/apiHelpers";

// Self-service registration is only allowed to create the very first admin
// account (a one-time "bootstrap" step). Once an admin exists, this route
// always rejects — every other account must be created by an admin from
// the Employees page.
export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return jsonError("Name, email and password are required");
    }
    if (String(password).length < 6) {
      return jsonError("Password must be at least 6 characters");
    }

    await connectDB();

    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount > 0) {
      return jsonError(
        "An admin account already exists. Please log in, or ask your admin to create your account.",
        403
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return jsonError("A user with this email already exists");

    const hashed = await hashPassword(password);
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashed,
      role: "admin",
      active: true,
    });

    const sessionUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role as "admin",
    };
    const token = await signSession(sessionUser);

    const res = NextResponse.json({ user: sessionUser }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (err) {
    console.error(err);
    return jsonError("Something went wrong while registering", 500);
  }
}
