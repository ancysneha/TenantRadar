import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth, getLandlordId } from "@/lib/api-auth";
import Ticket from "@/models/Ticket";
import Property from "@/models/Property";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const properties = await Property.find({ landlordId: getLandlordId(session!) });
  const propertyIds = properties.map((p) => p._id);

  const tickets = await Ticket.find({ propertyId: { $in: propertyIds } })
    .populate("tenantId")
    .populate("propertyId")
    .sort({ createdAt: -1 });

  return NextResponse.json(tickets);
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const landlordId = getLandlordId(session!);
  const body = await request.json();

  const property = await Property.findOne({
    _id: body.propertyId,
    landlordId,
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const ticket = await Ticket.create({
    title: body.title,
    description: body.description,
    tenantId: body.tenantId,
    propertyId: body.propertyId,
    conversationId: body.conversationId,
    category: body.category ?? "General",
    priority: body.priority ?? "medium",
    status: "open",
  });

  return NextResponse.json(ticket, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const landlordId = getLandlordId(session!);
  const body = await request.json();

  const ticket = await Ticket.findById(body.id).populate("propertyId");
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const property = await Property.findById(ticket.propertyId);
  if (!property || property.landlordId !== landlordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (body.title) ticket.title = body.title;
  if (body.description) ticket.description = body.description;
  if (body.status) ticket.status = body.status;
  if (body.priority) ticket.priority = body.priority;
  if (body.category) ticket.category = body.category;
  if (body.conversationId) ticket.conversationId = body.conversationId;

  await ticket.save();
  return NextResponse.json(ticket);
}
