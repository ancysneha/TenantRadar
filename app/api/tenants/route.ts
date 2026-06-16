import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth, getLandlordId } from "@/lib/api-auth";
import Tenant from "@/models/Tenant";
import Property from "@/models/Property";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const landlordId = getLandlordId(session!);

  const properties = await Property.find({ landlordId });
  const propertyIds = properties.map((p) => p._id);

  const tenants = await Tenant.find({ propertyId: { $in: propertyIds } })
    .populate("propertyId")
    .sort({ createdAt: -1 });

  return NextResponse.json(tenants);
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

  const tenant = await Tenant.create({
    name: body.name,
    email: body.email,
    phone: body.phone,
    propertyId: body.propertyId,
    leaseStart: body.leaseStart,
    leaseEnd: body.leaseEnd,
    rentAmount: body.rentAmount,
    rentStatus: body.rentStatus ?? "pending",
  });

  return NextResponse.json(tenant, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Tenant id required" }, { status: 400 });
  }

  await connectDB();
  const landlordId = getLandlordId(session!);

  const tenant = await Tenant.findById(id).populate("propertyId");
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const property = await Property.findById(tenant.propertyId);
  if (!property || property.landlordId !== landlordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await Tenant.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const landlordId = getLandlordId(session!);
  const body = await request.json();
  const { id, rentStatus } = body;

  if (!id || !rentStatus) {
    return NextResponse.json({ error: "id and rentStatus are required" }, { status: 400 });
  }

  const tenant = await Tenant.findById(id);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const property = await Property.findOne({
    _id: tenant.propertyId,
    landlordId,
  });

  if (!property) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  tenant.rentStatus = rentStatus;
  await tenant.save();

  return NextResponse.json(tenant);
}
