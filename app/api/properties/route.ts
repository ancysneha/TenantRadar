import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth, getLandlordId } from "@/lib/api-auth";
import Property from "@/models/Property";
import Tenant from "@/models/Tenant";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const properties = await Property.find({
    landlordId: getLandlordId(session!),
  }).sort({ createdAt: -1 });

  return NextResponse.json(properties);
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const body = await request.json();

  const property = await Property.create({
    landlordId: getLandlordId(session!),
    address: body.address,
    unit: body.unit,
    type: body.type,
    rentDueDay: body.rentDueDay,
  });

  return NextResponse.json(property, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Property id required" }, { status: 400 });
  }

  await connectDB();
  const landlordId = getLandlordId(session!);

  const property = await Property.findOne({ _id: id, landlordId });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const tenantCount = await Tenant.countDocuments({ propertyId: id });
  if (tenantCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete a property with active tenants" },
      { status: 409 }
    );
  }

  await Property.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
