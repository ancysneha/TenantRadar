import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Tenant from "@/models/Tenant";
import Property from "@/models/Property";
import Message from "@/models/Message";
import Ticket from "@/models/Ticket";
import { AIActivityFeed } from "@/components/AIActivityFeed";
import {
  mergeActivities,
  messageToActivity,
  ticketToActivity,
  type AIActivity,
} from "@/lib/ai-activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Wrench, AlertTriangle } from "lucide-react";
import { refreshTenantStatuses } from "@/lib/rent-logic";

async function getLandlordScope(landlordId: string) {
  const properties = await Property.find({ landlordId });
  const propertyIds = properties.map((p) => p._id);
  const tenants = await Tenant.find({ propertyId: { $in: propertyIds } });
  const tenantIds = tenants.map((t) => t._id);
  return { propertyIds, tenantIds, propertyCount: properties.length };
}

async function getStats(landlordId: string) {
  await connectDB();

  const { propertyIds, tenantIds, propertyCount } = await getLandlordScope(landlordId);

  // Refresh statuses before counting
  await refreshTenantStatuses(propertyIds);

  const [messageCount, pendingMessages, openTickets, overdueTenants] = await Promise.all([
    Message.countDocuments({ tenantId: { $in: tenantIds } }),
    Message.countDocuments({ tenantId: { $in: tenantIds }, status: "pending" }),
    Ticket.countDocuments({
      propertyId: { $in: propertyIds },
      status: { $in: ["open", "in_progress"] },
    }),
    Tenant.countDocuments({
      propertyId: { $in: propertyIds },
      rentStatus: "overdue",
    }),
  ]);

  return {
    tenantCount: tenantIds.length,
    propertyCount,
    messageCount,
    pendingMessages,
    openTickets,
    overdueTenants,
  };
}

async function getRecentAIActivities(landlordId: string): Promise<AIActivity[]> {
  await connectDB();

  const { propertyIds, tenantIds } = await getLandlordScope(landlordId);

  const [messages, tickets] = await Promise.all([
    Message.find({
      tenantId: { $in: tenantIds },
      status: { $in: ["handled", "escalated"] },
    })
      .populate("tenantId", "name")
      .sort({ updatedAt: -1 })
      .limit(20),
    Ticket.find({
      propertyId: { $in: propertyIds },
      status: "resolved",
    })
      .populate("tenantId", "name")
      .sort({ updatedAt: -1 })
      .limit(20),
  ]);

  const activities: AIActivity[] = [];

  for (const message of messages) {
    const activity = messageToActivity(message);
    if (activity) activities.push(activity);
  }

  for (const ticket of tickets) {
    const activity = ticketToActivity(ticket);
    if (activity) activities.push(activity);
  }

  return mergeActivities(activities, 10);
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const landlordId = session!.user.id;
  const [stats, activities] = await Promise.all([
    getStats(landlordId),
    getRecentAIActivities(landlordId),
  ]);

  const cards = [
    {
      title: "Tenants",
      value: stats.tenantCount,
      description: `${stats.propertyCount} properties`,
      icon: Users,
    },
    {
      title: "Messages",
      value: stats.messageCount,
      description: `${stats.pendingMessages} pending agent review`,
      icon: MessageSquare,
    },
    {
      title: "Open tickets",
      value: stats.openTickets,
      description: "Maintenance in progress",
      icon: Wrench,
    },
    {
      title: "Overdue rent",
      value: stats.overdueTenants,
      description: "Tenants past due",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {session?.user?.name}. Your AI agent is monitoring tenant communications.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ title, value, description, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AIActivityFeed activities={activities} />
    </div>
  );
}
