import mongoose, { Schema, Document, Model } from "mongoose";

export type PropertyType = "apartment" | "house" | "commercial";

export interface IProperty extends Document {
  landlordId: string;
  address: string;
  unit?: string;
  type: PropertyType;
  rentDueDay: number;
}

const PropertySchema = new Schema<IProperty>(
  {
    landlordId: { type: String, required: true, index: true },
    address: { type: String, required: true },
    unit: { type: String },
    type: {
      type: String,
      enum: ["apartment", "house", "commercial"],
      required: true,
    },
    rentDueDay: { type: Number, required: true, min: 1, max: 28 },
  },
  { timestamps: true }
);

const Property: Model<IProperty> =
  mongoose.models.Property ?? mongoose.model<IProperty>("Property", PropertySchema);

export default Property;
