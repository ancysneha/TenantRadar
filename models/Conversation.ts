import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ConversationStatus = "active" | "closed";

export interface IConversation extends Document {
  tenantId: Types.ObjectId;
  status: ConversationStatus;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ConversationSchema.index({ tenantId: 1, status: 1 });

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ??
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
