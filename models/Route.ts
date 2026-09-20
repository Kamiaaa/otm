import mongoose, { Schema, model, models, type Document, type Types } from "mongoose";

// A predefined trip template: one or more PickupPoint stops leading to a
// named destination, so an employee (or admin) can select the whole trip
// in one go instead of typing pickup/drop text every time.
export interface IRoute extends Document {
  name: string;
  description?: string;
  pickupPoints: Types.ObjectId[];
  destination: string;
  estimatedDistanceKm?: number;
  estimatedDurationMinutes?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RouteSchema = new Schema<IRoute>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    pickupPoints: [{ type: Schema.Types.ObjectId, ref: "PickupPoint", required: true }],
    destination: { type: String, required: true, trim: true },
    estimatedDistanceKm: { type: Number, min: 0 },
    estimatedDurationMinutes: { type: Number, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default (models.Route as mongoose.Model<IRoute>) ||
  model<IRoute>("Route", RouteSchema);
