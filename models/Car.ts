import mongoose, { Schema, model, models } from "mongoose";

export interface ICar {
  name: string;
  plateNumber: string;
  model?: string;
  seatCapacity?: number;
  status: "available" | "maintenance" | "inactive";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CarSchema = new Schema<ICar>(
  {
    name: { type: String, required: true, trim: true },
    plateNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    model: { type: String, trim: true },
    seatCapacity: { type: Number, min: 1 },
    status: { type: String, enum: ["available", "maintenance", "inactive"], default: "available" },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default (models.Car as mongoose.Model<ICar>) ||
  model<ICar>("Car", CarSchema);