import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, isResponse, jsonError, getAvailableResources } from "@/lib/apiHelpers";

// GET /api/rides/available-resources?date=YYYY-MM-DD&excludeRideId=optional
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;

  const date = req.nextUrl.searchParams.get("date");
  const excludeRideId = req.nextUrl.searchParams.get("excludeRideId") || undefined;
  if (!date) return jsonError("date query param is required");

  await connectDB();
  const { cars, drivers } = await getAvailableResources(date, excludeRideId);
  return NextResponse.json({ cars, drivers });
}
