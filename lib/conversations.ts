import Conversation from "@/models/Conversation";
import type { Types } from "mongoose";

export async function getOrCreateConversation(
  tenantId: Types.ObjectId | string
): Promise<{ _id: Types.ObjectId }> {
  let conversation = await Conversation.findOne({
    tenantId,
    status: "active",
  }).sort({ lastMessageAt: -1 });

  if (!conversation) {
    conversation = await Conversation.create({
      tenantId,
      status: "active",
      lastMessageAt: new Date(),
    });
  }

  return conversation;
}

export async function touchConversation(conversationId: Types.ObjectId | string) {
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessageAt: new Date(),
  });
}
