import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Car from "@/models/Car";
import { requireAdmin, isResponse, jsonError } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;

  try {
    const body = await req.json();
    const { name, plateNumber, model, seatCapacity, status, notes } = body;
    if (!name || !plateNumber) return jsonError("Name and plate number are required");

    await connectDB();
    const car = await Car.create({
      name,
      plateNumber,
      model,
      seatCapacity: seatCapacity ? Number(seatCapacity) : undefined,
      status: status || "available",
      notes,
    });
    return NextResponse.json({ car }, { status: 201 });
  } catch (err: unknown) {
    const message =
      typeof err === "object" && err && "code" in err && (err as { code: number }).code === 11000
        ? "A car with this plate number already exists"
        : "Failed to create car";
    console.error(err);
    return jsonError(message, 400);
  }
}
