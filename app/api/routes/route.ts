import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Route from "@/models/Route";
import { requireAdmin, isResponse, jsonError } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;

  try {
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

    if (!name || !destination) return jsonError("Name and destination are required");
    if (!Array.isArray(pickupPoints) || pickupPoints.length === 0) {
      return jsonError("Select at least one pickup point for this route");
    }

    await connectDB();
    const route = await Route.create({
      name,
      description,
      pickupPoints,
      destination,
      estimatedDistanceKm: estimatedDistanceKm ? Number(estimatedDistanceKm) : undefined,
      estimatedDurationMinutes: estimatedDurationMinutes ? Number(estimatedDurationMinutes) : undefined,
      active: active !== undefined ? active : true,
    });
    const populated = await route.populate("pickupPoints", "name address");
    return NextResponse.json({ route: populated }, { status: 201 });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to create route", 400);
  }
}
