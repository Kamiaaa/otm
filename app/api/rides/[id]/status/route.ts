import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Ride from "@/models/Ride";
import { requireUser, isResponse, jsonError } from "@/lib/apiHelpers";

const VALID_STATUSES = ["ongoing", "completed", "cancelled"] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

// Passenger changes status after the ride ends (e.g. to "completed").
// If the passenger forgets, an admin can change the status on their behalf.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (isResponse(user)) return user;

  try {
    const { id } = await params;
    const { status, remarks } = await req.json();

    if (!VALID_STATUSES.includes(status)) {
      return jsonError("Status must be one of: ongoing, completed, cancelled");
    }

    await connectDB();
    const ride = await Ride.findById(id);
    if (!ride) return jsonError("Ride not found", 404);

    const isOwner = ride.employee.toString() === user.id;
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) {
      return jsonError("You can only update the status of your own rides", 403);
    }

    if (["completed", "cancelled"].includes(ride.status)) {
      return jsonError("This ride's status can no longer be changed");
    }

    const nextStatus = status as ValidStatus;

    // Basic forward-only flow: pending/assigned -> ongoing -> completed, or -> cancelled anytime before completion.
    if (nextStatus === "ongoing" && ride.status !== "assigned") {
      return jsonError("Only an assigned ride can be started");
    }

    ride.set({
      status: nextStatus,
      ...(remarks && { remarks }),
      ...(nextStatus === "completed" && {
        completedBy: user.id,
        completedAt: new Date(),
      }),
      statusChangedByRole: isAdmin && !isOwner ? "admin" : "employee",
    });

    await ride.save();
    return NextResponse.json({ ride });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to update ride status", 400);
  }
}
