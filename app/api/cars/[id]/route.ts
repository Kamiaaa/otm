import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Car from "@/models/Car";
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
    const { name, plateNumber, model, seatCapacity, status, notes } = body;

    await connectDB();
    const car = await Car.findByIdAndUpdate(
      id,
      {
        ...(name !== undefined && { name }),
        ...(plateNumber !== undefined && { plateNumber }),
        ...(model !== undefined && { model }),
        ...(seatCapacity !== undefined && { seatCapacity: Number(seatCapacity) }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
      { new: true, runValidators: true }
    );
    if (!car) return jsonError("Car not found", 404);
    return NextResponse.json({ car });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to update car", 400);
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
  const car = await Car.findByIdAndDelete(id);
  if (!car) return jsonError("Car not found", 404);
  return NextResponse.json({ ok: true });
}
