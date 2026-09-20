import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Ride from "@/models/Ride";
import Car from "@/models/Car";
import Driver from "@/models/Driver";
import { requireUser, isResponse, jsonError } from "@/lib/apiHelpers";

// Creates a ride. Employees create a request for themselves (status: pending).
// Admins may optionally create a duty directly for any employee, and may
// optionally assign a car + driver immediately (status becomes "assigned").
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (isResponse(user)) return user;

  try {
    const body = await req.json();
    const {
      purpose,
      pickupLocation,
      dropLocation,
      routeId,
      pickupPointId,
      rideDate,
      startTime,
      endTime,
      passengers,
      employeeId, // admin only
      carId, // admin only, optional
      driverId, // admin only, optional
    } = body;

    if (!purpose || !pickupLocation || !dropLocation || !rideDate || !startTime) {
      return jsonError("Purpose, locations, date and start time are required");
    }

    await connectDB();

    const targetEmployeeId =
      user.role === "admin" && employeeId ? employeeId : user.id;

    const rideData: Record<string, unknown> = {
      employee: targetEmployeeId,
      purpose,
      pickupLocation,
      dropLocation,
      route: routeId || null,
      pickupPoint: pickupPointId || null,
      rideDate,
      startTime,
      endTime,
      passengers: passengers ? Number(passengers) : undefined,
      createdBy: user.id,
      status: "pending",
    };

    if (user.role === "admin" && carId && driverId) {
      const [car, driver] = await Promise.all([
        Car.findById(carId),
        Driver.findById(driverId),
      ]);
      if (!car || car.status !== "available") return jsonError("Selected car is not available");
      if (!driver || driver.status !== "available") return jsonError("Selected driver is not available");

      const conflict = await Ride.findOne({
        rideDate,
        status: { $in: ["assigned", "ongoing"] },
        $or: [{ car: carId }, { driver: driverId }],
      });
      if (conflict) return jsonError("That car or driver is already booked on this date");

      rideData.car = carId;
      rideData.driver = driverId;
      rideData.status = "assigned";
      rideData.assignedBy = user.id;
      rideData.assignedAt = new Date();
    }

    const ride = await Ride.create(rideData);
    return NextResponse.json({ ride }, { status: 201 });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to create ride", 400);
  }
}
