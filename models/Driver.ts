import mongoose, { Schema, model, models, type Document } from "mongoose";

export interface IDriver extends Document {
  name: string;
  phone: string;
  licenseNumber?: string;
  status: "available" | "inactive";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    licenseNumber: { type: String, trim: true },
    status: {
      type: String,
      enum: ["available", "inactive"],
      default: "available",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default (models.Driver as mongoose.Model<IDriver>) ||
  model<IDriver>("Driver", DriverSchema);
