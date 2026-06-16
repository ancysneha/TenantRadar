import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MessageClassification, MessageStatus } from "@/models/Message";

export interface ConversationListItem {
  _id: string;
  tenantName: string;
  tenantEmail: string;
  lastMessageAt: string;
  latestMessage?: {
    body: string;
    status: MessageStatus;
    classification: MessageClassification;
    receivedAt: string;
  } | null;
  pendingCount: number;
}

interface ConversationListProps {
  conversations: ConversationListItem[];
  selectedId: string | null;
  onSelect: (conversationId: string) => void;
  loading?: boolean;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  loading,
}: ConversationListProps) {
  if (loading) {
    return (
      <p className="text-sm text-muted-foreground p-4 text-center">Loading conversations...</p>
    );
  }

  if (conversations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground p-4 text-center">
        No conversations yet. Submit a message to start one.
      </p>
    );
  }

  const grouped = conversations.reduce<Record<string, ConversationListItem[]>>((acc, item) => {
    const key = item.tenantName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="divide-y">
      {Object.entries(grouped).map(([tenantName, items]) => (
        <div key={tenantName}>
          <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40">
            {tenantName}
          </p>
          <ul>
            {items.map((conversation) => (
              <li key={conversation._id}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation._id)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-accent transition-colors border-l-2",
                    selectedId === conversation._id
                      ? "border-l-primary bg-accent/50"
                      : "border-l-transparent"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium truncate">{conversation.tenantEmail}</p>
                    {conversation.pendingCount > 0 && (
                      <Badge variant="warning" className="shrink-0">
                        {conversation.pendingCount} pending
                      </Badge>
                    )}
                  </div>
                  {conversation.latestMessage && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {conversation.latestMessage.body}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(conversation.lastMessageAt).toLocaleString()}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
