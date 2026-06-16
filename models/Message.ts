import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type MessageSource = "email" | "manual";
export type MessageClassification =
  | "maintenance"
  | "payment"
  | "complaint"
  | "general"
  | "unknown";
export type MessageStatus = "handled" | "escalated" | "pending";

export interface IMessage extends Document {
  tenantId: Types.ObjectId;
  conversationId: Types.ObjectId;
  source: MessageSource;
  body: string;
  receivedAt: Date;
  classification: MessageClassification;
  agentAction?: string;
  agentReply?: string;
  status: MessageStatus;
  decisionLog?: string;
}

const MessageSchema = new Schema<IMessage>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    source: { type: String, enum: ["email", "manual"], required: true },
    body: { type: String, required: true },
    receivedAt: { type: Date, default: Date.now },
    classification: {
      type: String,
      enum: ["maintenance", "payment", "complaint", "general", "unknown"],
      default: "unknown",
    },
    agentAction: { type: String },
    agentReply: { type: String },
    status: {
      type: String,
      enum: ["handled", "escalated", "pending"],
      default: "pending",
    },
    decisionLog: { type: String },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, receivedAt: 1 });

const Message: Model<IMessage> =
  mongoose.models.Message ?? mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
