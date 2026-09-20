import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PickupPoint from "@/models/PickupPoint";
import { requireAdmin, isResponse, jsonError } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;

  try {
    const body = await req.json();
    const { name, address, landmark, active, notes } = body;
    if (!name || !address) return jsonError("Name and address are required");

    await connectDB();
    const pickupPoint = await PickupPoint.create({
      name,
      address,
      landmark,
      active: active !== undefined ? active : true,
      notes,
    });
    return NextResponse.json({ pickupPoint }, { status: 201 });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to create pickup point", 400);
  }
}
