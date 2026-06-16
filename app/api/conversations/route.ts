import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth, getLandlordId } from "@/lib/api-auth";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import Tenant from "@/models/Tenant";
import Property from "@/models/Property";

async function getLandlordTenantIds(landlordId: string) {
  const properties = await Property.find({ landlordId });
  const propertyIds = properties.map((p) => p._id);
  const tenants = await Tenant.find({ propertyId: { $in: propertyIds } });
  return tenants.map((t) => t._id);
}

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const tenantIds = await getLandlordTenantIds(getLandlordId(session!));

  const conversations = await Conversation.find({ tenantId: { $in: tenantIds } })
    .populate("tenantId", "name email")
    .sort({ lastMessageAt: -1 });

  const conversationIds = conversations.map((c) => c._id);

  const latestMessages = await Message.aggregate([
    { $match: { conversationId: { $in: conversationIds } } },
    { $sort: { receivedAt: -1 } },
    {
      $group: {
        _id: "$conversationId",
        body: { $first: "$body" },
        status: { $first: "$status" },
        classification: { $first: "$classification" },
        receivedAt: { $first: "$receivedAt" },
      },
    },
  ]);

  const pendingCounts = await Message.aggregate([
    {
      $match: {
        conversationId: { $in: conversationIds },
        status: "pending",
      },
    },
    { $group: { _id: "$conversationId", count: { $sum: 1 } } },
  ]);

  const latestMap = new Map(latestMessages.map((m) => [m._id.toString(), m]));
  const pendingMap = new Map(pendingCounts.map((p) => [p._id.toString(), p.count]));

  const result = conversations.map((conversation) => {
    const id = conversation._id.toString();
    const latest = latestMap.get(id);
    return {
      _id: id,
      tenantId: conversation.tenantId,
      status: conversation.status,
      lastMessageAt: conversation.lastMessageAt,
      latestMessage: latest
        ? {
            body: latest.body,
            status: latest.status,
            classification: latest.classification,
            receivedAt: latest.receivedAt,
          }
        : null,
      pendingCount: pendingMap.get(id) ?? 0,
    };
  });

  return NextResponse.json(result);
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

  const conversation = await Conversation.create({
    tenantId: body.tenantId,
    status: "active",
    lastMessageAt: new Date(),
  });

  return NextResponse.json(conversation, { status: 201 });
}
