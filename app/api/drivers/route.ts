import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Driver from "@/models/Driver";
import { requireAdmin, isResponse, jsonError } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;

  try {
    const body = await req.json();
    const { name, phone, licenseNumber, status, notes } = body;
    if (!name || !phone) return jsonError("Name and phone are required");

    await connectDB();
    const driver = await Driver.create({
      name,
      phone,
      licenseNumber,
      status: status || "available",
      notes,
    });
    return NextResponse.json({ driver }, { status: 201 });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to create driver", 400);
  }
}
