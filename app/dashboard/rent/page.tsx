import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Tenant from "@/models/Tenant";
import Property from "@/models/Property";
import { RentManagement } from "@/components/RentManagement";
import { refreshTenantStatuses } from "@/lib/rent-logic";

export default async function RentPage() {
  const session = await getServerSession(authOptions);
  await connectDB();

  const properties = await Property.find({ landlordId: session!.user.id });
  const propertyIds = properties.map((p) => p._id);
  const propertyMap = new Map(properties.map((p) => [p._id.toString(), p.address]));

  // Ensure overdue statuses are updated before display
  await refreshTenantStatuses(propertyIds);

  const tenants = await Tenant.find({
    propertyId: { $in: propertyIds },
  }).sort({ rentDueDay: 1 });

  const items = tenants.map((tenant) => ({
    _id: tenant._id.toString(),
    name: tenant.name,
    propertyAddress: propertyMap.get(tenant.propertyId.toString()) || "Unknown Property",
    rentAmount: tenant.rentAmount,
    rentDueDay: tenant.rentDueDay,
    rentStatus: tenant.rentStatus as "paid" | "pending" | "overdue",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Rent Management</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track payments, manage due dates, and handle overdue accounts.
        </p>
      </div>
      <RentManagement tenants={items} />
    </div>
  );
}
