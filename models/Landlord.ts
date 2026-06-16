import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILandlord extends Document {
  email: string;
  passwordHash: string;
  name: string;
}

const LandlordSchema = new Schema<ILandlord>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

const Landlord: Model<ILandlord> =
  mongoose.models.Landlord ?? mongoose.model<ILandlord>("Landlord", LandlordSchema);

export default Landlord;
