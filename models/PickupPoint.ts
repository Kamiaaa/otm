import mongoose, { Schema, model, models, type Document } from "mongoose";

export interface IPickupPoint extends Document {
  name: string;
  address: string;
  landmark?: string;
  active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PickupPointSchema = new Schema<IPickupPoint>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    active: { type: Boolean, default: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default (models.PickupPoint as mongoose.Model<IPickupPoint>) ||
  model<IPickupPoint>("PickupPoint", PickupPointSchema);
