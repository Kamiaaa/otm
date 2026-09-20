import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Ride from "@/models/Ride";
import Car from "@/models/Car";
import Driver from "@/models/Driver";
import { requireAdmin, isResponse, jsonError } from "@/lib/apiHelpers";

// Admin selects a car + driver (as per availability) for a pending/assigned ride.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;

  try {
    const { id } = await params;
    const { carId, driverId } = await req.json();
    if (!carId || !driverId) return jsonError("Car and driver are required");

    await connectDB();
    const ride = await Ride.findById(id);
    if (!ride) return jsonError("Ride not found", 404);
    if (!["pending", "assigned"].includes(ride.status)) {
      return jsonError("Only pending or assigned rides can be (re)assigned");
    }

    const [car, driver] = await Promise.all([
      Car.findById(carId),
      Driver.findById(driverId),
    ]);
    if (!car || car.status !== "available") return jsonError("Selected car is not available");
    if (!driver || driver.status !== "available") return jsonError("Selected driver is not available");

    const conflict = await Ride.findOne({
      _id: { $ne: id },
      rideDate: ride.rideDate,
      status: { $in: ["assigned", "ongoing"] },
      $or: [{ car: carId }, { driver: driverId }],
    });
    if (conflict) return jsonError("That car or driver is already booked on this date");

    ride.set({
      car: carId,
      driver: driverId,
      status: "assigned",
      assignedBy: admin.id,
      assignedAt: new Date(),
    });
    await ride.save();

    return NextResponse.json({ ride });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to assign ride", 400);
  }
}
