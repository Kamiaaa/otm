import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Route from "@/models/Route";
import Ride from "@/models/Ride";
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
    const {
      name,
      description,
      pickupPoints,
      destination,
      estimatedDistanceKm,
      estimatedDurationMinutes,
      active,
    } = body;

    if (pickupPoints !== undefined && (!Array.isArray(pickupPoints) || pickupPoints.length === 0)) {
      return jsonError("A route needs at least one pickup point");
    }

    await connectDB();
    const route = await Route.findByIdAndUpdate(
      id,
      {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(pickupPoints !== undefined && { pickupPoints }),
        ...(destination !== undefined && { destination }),
        ...(estimatedDistanceKm !== undefined && {
          estimatedDistanceKm: Number(estimatedDistanceKm),
        }),
        ...(estimatedDurationMinutes !== undefined && {
          estimatedDurationMinutes: Number(estimatedDurationMinutes),
        }),
        ...(active !== undefined && { active }),
      },
      { new: true, runValidators: true }
    ).populate("pickupPoints", "name address");
    if (!route) return jsonError("Route not found", 404);
    return NextResponse.json({ route });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to update route", 400);
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

  const usedInRide = await Ride.exists({ route: id });
  if (usedInRide) {
    return jsonError("This route is referenced by existing rides and can't be deleted. Mark it inactive instead.", 400);
  }

  const route = await Route.findByIdAndDelete(id);
  if (!route) return jsonError("Route not found", 404);
  return NextResponse.json({ ok: true });
}
