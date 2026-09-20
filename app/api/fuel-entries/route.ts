import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FuelEntry from "@/models/FuelEntry";
import Car from "@/models/Car";
import { requireAdmin, isResponse, jsonError } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;

  try {
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

    if (!carId || !date || odometerReading === undefined || !fuelQuantity || pricePerUnit === undefined) {
      return jsonError("Car, date, odometer reading, quantity and price are required");
    }

    const odometer = Number(odometerReading);
    const quantity = Number(fuelQuantity);
    const price = Number(pricePerUnit);
    if (quantity <= 0) return jsonError("Fuel quantity must be greater than zero");
    if (price < 0) return jsonError("Price cannot be negative");
    if (odometer < 0) return jsonError("Odometer reading cannot be negative");

    await connectDB();

    const car = await Car.findById(carId);
    if (!car) return jsonError("Car not found", 404);

    // Keep odometer readings sane per car: each new fill-up should be at a
    // higher reading than the last one on record for that car.
    const lastEntry = await FuelEntry.findOne({ car: carId }).sort({ odometerReading: -1 });
    if (lastEntry && odometer <= lastEntry.odometerReading) {
      return jsonError(
        `Odometer reading must be greater than the last recorded reading for this car (${lastEntry.odometerReading} km, on ${lastEntry.date})`
      );
    }

    const totalCost = Number((quantity * price).toFixed(2));

    const entry = await FuelEntry.create({
      car: carId,
      driver: driverId || null,
      recordedBy: admin.id,
      date,
      odometerReading: odometer,
      fuelQuantity: quantity,
      pricePerUnit: price,
      totalCost,
      fuelType: fuelType || "petrol",
      vendor,
      notes,
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to save fuel entry", 400);
  }
}
