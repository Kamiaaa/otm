import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Driver from "@/models/Driver";
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
    const { name, phone, licenseNumber, status, notes } = body;

    await connectDB();
    const driver = await Driver.findByIdAndUpdate(
      id,
      {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(licenseNumber !== undefined && { licenseNumber }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
      { new: true, runValidators: true }
    );
    if (!driver) return jsonError("Driver not found", 404);
    return NextResponse.json({ driver });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to update driver", 400);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;

  const { id } = await params;
  await connectDB();
  const driver = await Driver.findByIdAndDelete(id);
  if (!driver) return jsonError("Driver not found", 404);
  return NextResponse.json({ ok: true });
}
