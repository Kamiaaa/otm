import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FuelEntry from "@/models/FuelEntry";
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
      carId,
      driverId,
      date,
      odometerReading,
      fuelQuantity,
      pricePerUnit,
      fuelType,
      vendor,
      notes,
    } = body;

    await connectDB();
    const entry = await FuelEntry.findById(id);
    if (!entry) return jsonError("Fuel entry not found", 404);

    const nextQuantity = fuelQuantity !== undefined ? Number(fuelQuantity) : entry.fuelQuantity;
    const nextPrice = pricePerUnit !== undefined ? Number(pricePerUnit) : entry.pricePerUnit;
    if (nextQuantity <= 0) return jsonError("Fuel quantity must be greater than zero");
    if (nextPrice < 0) return jsonError("Price cannot be negative");

    entry.set({
      ...(carId !== undefined && { car: carId }),
      ...(driverId !== undefined && { driver: driverId || null }),
      ...(date !== undefined && { date }),
      ...(odometerReading !== undefined && { odometerReading: Number(odometerReading) }),
      fuelQuantity: nextQuantity,
      pricePerUnit: nextPrice,
      totalCost: Number((nextQuantity * nextPrice).toFixed(2)),
      ...(fuelType !== undefined && { fuelType }),
      ...(vendor !== undefined && { vendor }),
      ...(notes !== undefined && { notes }),
    });
    await entry.save();

    return NextResponse.json({ entry });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to update fuel entry", 400);
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
  const entry = await FuelEntry.findByIdAndDelete(id);
  if (!entry) return jsonError("Fuel entry not found", 404);
  return NextResponse.json({ ok: true });
}
