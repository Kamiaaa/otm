import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";
import { requireAdmin, isResponse, jsonError } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;

  try {
    const body = await req.json();
    const { name, email, password, role, department, phone } = body;
    if (!name || !email || !password) {
      return jsonError("Name, email and password are required");
    }
    if (password.length < 6) {
      return jsonError("Password must be at least 6 characters");
    }

    await connectDB();
    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) return jsonError("A user with this email already exists");

    const hashed = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role === "admin" ? "admin" : "employee",
      department,
      phone,
    });

    const { password: _pw, ...safeUser } = user.toObject();
    void _pw;
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to create employee", 400);
  }
}
