import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth, getLandlordId } from "@/lib/api-auth";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import Tenant from "@/models/Tenant";
import Property from "@/models/Property";

async function verifyConversationAccess(conversationId: string, landlordId: string) {
  const conversation = await Conversation.findById(conversationId).populate(
    "tenantId",
    "name email propertyId"
  );

  if (!conversation) return null;

  const tenant = await Tenant.findById(conversation.tenantId).populate("propertyId");
  if (!tenant) return null;

  const property = await Property.findById(tenant.propertyId);
  if (!property || property.landlordId !== landlordId) return null;

  return { conversation, tenant };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const access = await verifyConversationAccess(params.id, getLandlordId(session!));

  if (!access) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const messages = await Message.find({ conversationId: params.id })
    .sort({ receivedAt: 1 });

  return NextResponse.json({
    conversation: {
      _id: access.conversation._id.toString(),
      tenantId: access.conversation.tenantId,
      status: access.conversation.status,
      lastMessageAt: access.conversation.lastMessageAt,
    },
    messages,
  });
}
