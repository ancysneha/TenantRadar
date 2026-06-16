"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TicketPriority, TicketStatus } from "@/models/Ticket";

export interface TicketListItem {
  _id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  tenantName?: string;
  propertyAddress?: string;
  createdAt: string;
}

interface TicketListProps {
  tickets: TicketListItem[];
}

const priorityVariant: Record<TicketPriority, "secondary" | "warning" | "danger"> = {
  low: "secondary",
  medium: "warning",
  high: "danger",
};

const statusLabel: Record<TicketStatus, string> = {
  open: "open",
  in_progress: "in progress",
  resolved: "resolved",
};

export function TicketList({ tickets }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No maintenance tickets. The AI agent creates tickets from tenant messages.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Card key={ticket._id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">{ticket.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {ticket.tenantName}
                {ticket.propertyAddress && ` · ${ticket.propertyAddress}`}
              </p>
              <div className="flex gap-2 mt-3">
  {ticket.status === "open" && (
    <button
      className="px-3 py-1 border rounded"
      onClick={async () => {
        await fetch("/api/tickets", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: ticket._id,
            status: "in_progress",
          }),
        });

        window.location.reload();
      }}
    >
      Start Work
    </button>
  )}

  {ticket.status === "in_progress" && (
    <button
      className="px-3 py-1 border rounded"
      onClick={async () => {
        await fetch("/api/tickets", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: ticket._id,
            status: "resolved",
          }),
        });

        window.location.reload();
      }}
    >
      Resolve
    </button>
  )}
</div>
            </div>
            <div className="flex gap-2">
              <Badge variant={priorityVariant[ticket.priority]}>{ticket.priority}</Badge>
              <Badge variant="outline">{statusLabel[ticket.status]}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">{ticket.description}</p>
            <p className="text-xs text-muted-foreground">
  {new Date(ticket.createdAt).toISOString().split("T")[0]}
</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
