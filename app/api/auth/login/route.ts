import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyPassword, signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { jsonError } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return jsonError("Email and password are required");

    await connectDB();
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || !user.active) return jsonError("Invalid credentials", 401);

    const valid = await verifyPassword(password, user.password);
    if (!valid) return jsonError("Invalid credentials", 401);

    const sessionUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const token = await signSession(sessionUser);

    const res = NextResponse.json({ user: sessionUser });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (err) {
    console.error(err);
    return jsonError("Something went wrong while logging in", 500);
  }
}
