import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import Property from "@/models/Property";
import Tenant from "@/models/Tenant";
import { TicketTable } from "@/components/TicketTable";

export default async function TicketsPage() {
  const session = await getServerSession(authOptions);
  await connectDB();

  const properties = await Property.find({ landlordId: session!.user.id });
  const propertyIds = properties.map((p) => p._id);
  const propertyMap = new Map(properties.map((p) => [p._id.toString(), p.address]));

  const tenants = await Tenant.find({ propertyId: { $in: propertyIds } });
  const tenantMap = new Map(tenants.map((t) => [t._id.toString(), t.name]));

  const tickets = await Ticket.find({
    propertyId: { $in: propertyIds },
  }).sort({ createdAt: -1 });

  const items = tickets.map((ticket) => ({
    _id: ticket._id.toString(),
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority as "low" | "medium" | "high",
    status: ticket.status as "open" | "in_progress" | "resolved",
    category: ticket.category || "General",
    tenantName: tenantMap.get(ticket.tenantId.toString()) || "Unknown Tenant",
    propertyAddress: propertyMap.get(ticket.propertyId.toString()) || "Unknown Property",
    conversationId: ticket.conversationId?.toString() || "",
    createdAt: ticket.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Maintenance Tickets</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage and track resolving issues across your properties.
          </p>
        </div>
      </div>
      <TicketTable tickets={items} />
    </div>
  );
}
