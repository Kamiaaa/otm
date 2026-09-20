import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { requireUser, isResponse, jsonError } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return jsonError("Current password and new password are required");
    }
    if (String(newPassword).length < 6) {
      return jsonError("New password must be at least 6 characters");
    }
    if (currentPassword === newPassword) {
      return jsonError("New password must be different from your current password");
    }

    await connectDB();
    const user = await User.findById(session.id);
    if (!user || !user.active) return jsonError("Account not found", 404);

    const valid = await verifyPassword(String(currentPassword), user.password);
    if (!valid) return jsonError("Current password is incorrect", 400);

    user.password = await hashPassword(String(newPassword));
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonError("Something went wrong while changing your password", 500);
  }
}