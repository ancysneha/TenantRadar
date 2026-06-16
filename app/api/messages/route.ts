import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth, getLandlordId } from "@/lib/api-auth";
import { getOrCreateConversation, touchConversation } from "@/lib/conversations";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";
import Tenant from "@/models/Tenant";
import Property from "@/models/Property";

async function getLandlordTenantIds(landlordId: string) {
  const properties = await Property.find({ landlordId });
  const propertyIds = properties.map((p) => p._id);
  const tenants = await Tenant.find({ propertyId: { $in: propertyIds } });
  return tenants.map((t) => t._id);
}

async function verifyConversationForTenant(
  conversationId: string,
  tenantId: string,
  landlordId: string
) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation || conversation.tenantId.toString() !== tenantId) {
    return false;
  }

  const tenantIds = await getLandlordTenantIds(landlordId);
  return tenantIds.some((id) => id.toString() === tenantId);
}

export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const tenantIds = await getLandlordTenantIds(getLandlordId(session!));

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  const filter: Record<string, unknown> = { tenantId: { $in: tenantIds } };
  if (conversationId) {
    filter.conversationId = conversationId;
  }

  const messages = await Message.find(filter)
    .populate("tenantId")
    .populate("conversationId")
    .sort({ receivedAt: -1 });

  return NextResponse.json(messages);
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const landlordId = getLandlordId(session!);
  const body = await request.json();

  const tenantIds = await getLandlordTenantIds(landlordId);
  if (!tenantIds.some((id) => id.toString() === body.tenantId)) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  let conversationId = body.conversationId as string | undefined;

  if (conversationId) {
    const valid = await verifyConversationForTenant(
      conversationId,
      body.tenantId,
      landlordId
    );
    if (!valid) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
  } else {
    const conversation = await getOrCreateConversation(body.tenantId);
    conversationId = conversation._id.toString();
  }

  const message = await Message.create({
    tenantId: body.tenantId,
    conversationId,
    source: body.source ?? "manual",
    body: body.body,
    receivedAt: body.receivedAt ?? new Date(),
    status: "pending",
    classification: "unknown",
  });

  await touchConversation(conversationId);

  const populated = await Message.findById(message._id)
    .populate("tenantId")
    .populate("conversationId");

  return NextResponse.json(populated, { status: 201 });
}
