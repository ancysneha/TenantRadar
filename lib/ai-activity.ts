import type { MessageClassification, MessageStatus } from "@/models/Message";
import type { TicketStatus } from "@/models/Ticket";

export interface AIActivity {
  id: string;
  description: string;
  timestamp: Date;
}

interface PopulatedTenant {
  name: string;
}

export function buildMessageActivityLabel(
  classification: MessageClassification,
  status: MessageStatus,
  tenantName: string,
  agentAction?: string
): string {
  switch (classification) {
    case "maintenance":
      return agentAction || `Created maintenance ticket for ${tenantName}`;
    case "complaint":
      return status === "escalated"
        ? `Escalated complaint from ${tenantName}`
        : `Processed complaint from ${tenantName}`;
    case "payment":
      return `Processed rent payment confirmation for ${tenantName}`;
    case "general":
      return `Responded to inquiry from ${tenantName}`;
    default:
      return `Processed message from ${tenantName}`;
  }
}

export function messageToActivity(
  message: {
    _id: { toString(): string };
    status: MessageStatus;
    classification: MessageClassification;
    updatedAt?: Date;
    receivedAt: Date;
    tenantId: PopulatedTenant | { toString(): string };
  }
): AIActivity | null {
  if (message.status === "pending") return null;

  const tenant =
    typeof message.tenantId === "object" &&
    message.tenantId !== null &&
    "name" in message.tenantId
      ? message.tenantId
      : null;

  const tenantName = tenant?.name ?? "Unknown tenant";

  return {
    id: `message-${message._id.toString()}`,
    description: buildMessageActivityLabel(
      message.classification,
      message.status,
      tenantName,
      message.agentAction
    ),
    timestamp: message.updatedAt ?? message.receivedAt,
  };
}

export function ticketToActivity(
  ticket: {
    _id: { toString(): string };
    status: TicketStatus;
    updatedAt: Date;
    createdAt: Date;
    tenantId: PopulatedTenant | { toString(): string };
  }
): AIActivity | null {
  if (ticket.status !== "resolved") return null;

  const tenant =
    typeof ticket.tenantId === "object" &&
    ticket.tenantId !== null &&
    "name" in ticket.tenantId
      ? ticket.tenantId
      : null;

  const tenantName = tenant?.name ?? "Unknown tenant";

  return {
    id: `ticket-${ticket._id.toString()}`,
    description: `Resolved maintenance request for ${tenantName}`,
    timestamp: ticket.updatedAt,
  };
}

export function mergeActivities(activities: AIActivity[], limit = 10): AIActivity[] {
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}
