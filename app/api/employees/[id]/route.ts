import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";
import { requireAdmin, isResponse, jsonError } from "@/lib/apiHelpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, role, department, phone, active, password } = body;

    const update: Record<string, unknown> = {
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role: role === "admin" ? "admin" : "employee" }),
      ...(department !== undefined && { department }),
      ...(phone !== undefined && { phone }),
      ...(active !== undefined && { active }),
    };
    if (password) {
      if (String(password).length < 6) return jsonError("Password must be at least 6 characters");
      update.password = await hashPassword(password);
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!user) return jsonError("Employee not found", 404);
    return NextResponse.json({ user });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to update employee", 400);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;

  const { id } = await params;
  if (id === admin.id) return jsonError("You cannot delete your own account", 400);

  await connectDB();
  const user = await User.findByIdAndDelete(id);
  if (!user) return jsonError("Employee not found", 404);
  return NextResponse.json({ ok: true });
}
