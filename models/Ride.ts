import mongoose, { Schema, model, models, type Document, type Types } from "mongoose";

export type RideStatus = "pending" | "assigned" | "ongoing" | "completed" | "cancelled";

export interface IRide extends Document {
  employee: Types.ObjectId;
  purpose: string;
  pickupLocation: string;
  dropLocation: string;
  route?: Types.ObjectId | null;
  pickupPoint?: Types.ObjectId | null;
  rideDate: string; // stored as YYYY-MM-DD for simple day-based availability queries
  startTime: string; // HH:mm
  endTime?: string;
  passengers?: number;
  status: RideStatus;
  car?: Types.ObjectId | null;
  driver?: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  assignedBy?: Types.ObjectId | null;
  assignedAt?: Date | null;
  completedBy?: Types.ObjectId | null;
  completedAt?: Date | null;
  statusChangedByRole?: "admin" | "employee" | null;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RideSchema = new Schema<IRide>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    purpose: { type: String, required: true, trim: true },
    pickupLocation: { type: String, required: true, trim: true },
    dropLocation: { type: String, required: true, trim: true },
    route: { type: Schema.Types.ObjectId, ref: "Route", default: null },
    pickupPoint: { type: Schema.Types.ObjectId, ref: "PickupPoint", default: null },
    rideDate: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String },
    passengers: { type: Number, min: 1 },
    status: {
      type: String,
      enum: ["pending", "assigned", "ongoing", "completed", "cancelled"],
      default: "pending",
    },
    car: { type: Schema.Types.ObjectId, ref: "Car", default: null },
    driver: { type: Schema.Types.ObjectId, ref: "Driver", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    assignedAt: { type: Date, default: null },
    completedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    completedAt: { type: Date, default: null },
    statusChangedByRole: { type: String, enum: ["admin", "employee", null], default: null },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

RideSchema.index({ rideDate: 1, status: 1 });
RideSchema.index({ employee: 1, createdAt: -1 });

export default (models.Ride as mongoose.Model<IRide>) ||
  model<IRide>("Ride", RideSchema);
