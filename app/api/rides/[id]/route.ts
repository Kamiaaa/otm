import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Ride from "@/models/Ride";
import { requireAdmin, isResponse, jsonError } from "@/lib/apiHelpers";

// Admins can cancel/delete a ride request entirely (e.g. duplicate or invalid request).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;

  const { id } = await params;
  await connectDB();
  const ride = await Ride.findByIdAndDelete(id);
  if (!ride) return jsonError("Ride not found", 404);
  return NextResponse.json({ ok: true });
}
