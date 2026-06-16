import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type RentStatus = "paid" | "pending" | "overdue";

export interface ITenant extends Document {
  name: string;
  email: string;
  phone?: string;
  propertyId: Types.ObjectId;
  leaseStart: Date;
  leaseEnd: Date;
  rentAmount: number;
  rentStatus: RentStatus;
  rentDueDay: number;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    leaseStart: { type: Date, required: true },
    leaseEnd: { type: Date, required: true },
    rentAmount: { type: Number, required: true },
    rentDueDay: { type: Number, required: true, min: 1, max: 28, default: 1 },
    rentStatus: {
      type: String,
      enum: ["paid", "pending", "overdue"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Tenant: Model<ITenant> =
  mongoose.models.Tenant ?? mongoose.model<ITenant>("Tenant", TenantSchema);

export default Tenant;
