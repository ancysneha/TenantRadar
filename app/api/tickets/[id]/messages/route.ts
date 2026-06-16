import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth, getLandlordId } from "@/lib/api-auth";
import Ticket from "@/models/Ticket";
import Message from "@/models/Message";
import Property from "@/models/Property";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const landlordId = getLandlordId(session!);

  const ticket = await Ticket.findById(params.id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const property = await Property.findOne({
    _id: ticket.propertyId,
    landlordId,
  });

  if (!property) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!ticket.conversationId) {
    return NextResponse.json([]);
  }

  const messages = await Message.find({
    conversationId: ticket.conversationId,
  }).sort({ receivedAt: 1 });

  return NextResponse.json(messages);
}
