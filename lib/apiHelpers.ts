import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import type { SessionUser } from "@/types";
import Ride from "@/models/Ride";
import Car from "@/models/Car";
import Driver from "@/models/Driver";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Require any logged-in user. Returns the user or a 401 response. */
export async function requireUser(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return jsonError("Not authenticated", 401);
  return user;
}

/** Require a logged-in admin. Returns the user or an error response. */
export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return jsonError("Not authenticated", 401);
  if (user.role !== "admin") return jsonError("Admin access required", 403);
  return user;
}

export function isResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}

/**
 * Find cars and drivers that are NOT already assigned/ongoing on the given date.
 * Only cars/drivers with status "available" are considered eligible at all.
 */
export async function getAvailableResources(
  rideDate: string,
  excludeRideId?: string
) {
  const busyQuery: Record<string, unknown> = {
    rideDate,
    status: { $in: ["assigned", "ongoing"] },
  };
  if (excludeRideId) busyQuery._id = { $ne: excludeRideId };

  const busyRides = await Ride.find(busyQuery).select("car driver").lean();
  const busyCarIds = busyRides.map((r) => r.car).filter(Boolean);
  const busyDriverIds = busyRides.map((r) => r.driver).filter(Boolean);

  const [cars, drivers] = await Promise.all([
    Car.find({ status: "available", _id: { $nin: busyCarIds } })
      .sort({ name: 1 })
      .lean(),
    Driver.find({ status: "available", _id: { $nin: busyDriverIds } })
      .sort({ name: 1 })
      .lean(),
  ]);

  return { cars, drivers };
}
