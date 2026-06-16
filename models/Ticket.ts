import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type TicketPriority = "low" | "medium" | "high";
export type TicketStatus = "open" | "in_progress" | "resolved";

export interface ITicket extends Document {
  title: string;
  description: string;
  tenantId: Types.ObjectId;
  propertyId: Types.ObjectId;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  conversationId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    category: {
      type: String,
      enum: ["Electrical", "Plumbing", "HVAC", "General"],
      default: "General",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
  },
  { timestamps: true }
);

const Ticket: Model<ITicket> =
  mongoose.models.Ticket ?? mongoose.model<ITicket>("Ticket", TicketSchema);

export default Ticket;
