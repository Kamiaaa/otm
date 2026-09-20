import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PickupPoint from "@/models/PickupPoint";
import Route from "@/models/Route";
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
    const { name, address, landmark, active, notes } = body;

    await connectDB();
    const pickupPoint = await PickupPoint.findByIdAndUpdate(
      id,
      {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(landmark !== undefined && { landmark }),
        ...(active !== undefined && { active }),
        ...(notes !== undefined && { notes }),
      },
      { new: true, runValidators: true }
    );
    if (!pickupPoint) return jsonError("Pickup point not found", 404);
    return NextResponse.json({ pickupPoint });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to update pickup point", 400);
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

  const usedInRoute = await Route.exists({ pickupPoints: id });
  if (usedInRoute) {
    return jsonError("This pickup point is used in a route. Remove it from that route first.", 400);
  }

  const pickupPoint = await PickupPoint.findByIdAndDelete(id);
  if (!pickupPoint) return jsonError("Pickup point not found", 404);
  return NextResponse.json({ ok: true });
}
