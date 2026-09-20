import mongoose, { Schema, model, models, type Document, type Types } from "mongoose";

export type FuelType = "petrol" | "diesel" | "octane" | "cng" | "other";

// A single fuel fill-up for a car. `totalCost` is always computed server-side
// (quantity * pricePerUnit) — never trust a client-supplied total.
export interface IFuelEntry extends Document {
  car: Types.ObjectId;
  driver?: Types.ObjectId | null;
  recordedBy: Types.ObjectId;
  date: string; // YYYY-MM-DD
  odometerReading: number; // km, at time of this fill-up
  fuelQuantity: number; // liters
  pricePerUnit: number; // currency per liter
  totalCost: number;
  fuelType: FuelType;
  vendor?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FuelEntrySchema = new Schema<IFuelEntry>(
  {
    car: { type: Schema.Types.ObjectId, ref: "Car", required: true },
    driver: { type: Schema.Types.ObjectId, ref: "Driver", default: null },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    odometerReading: { type: Number, required: true, min: 0 },
    fuelQuantity: { type: Number, required: true, min: 0.01 },
    pricePerUnit: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    fuelType: {
      type: String,
      enum: ["petrol", "diesel", "octane", "cng", "other"],
      default: "petrol",
    },
    vendor: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

FuelEntrySchema.index({ car: 1, odometerReading: 1 });
FuelEntrySchema.index({ date: 1 });

export default (models.FuelEntry as mongoose.Model<IFuelEntry>) ||
  model<IFuelEntry>("FuelEntry", FuelEntrySchema);
