import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import type { MessageClassification, MessageStatus } from "@/models/Message";

export interface MessageFeedItem {
  _id: string;
  tenantName?: string;
  body: string;
  receivedAt: string;
  classification: MessageClassification;
  status: MessageStatus;
  agentAction?: string;
  agentReply?: string;
}

interface MessageFeedProps {
  messages: MessageFeedItem[];
  onProcessWithAI?: (messageId: string) => void;
  processingId?: string | null;
}

const statusVariant: Record<MessageStatus, "success" | "warning" | "secondary"> = {
  handled: "success",
  escalated: "warning",
  pending: "secondary",
};

export function MessageFeed({ messages, onProcessWithAI, processingId }: MessageFeedProps) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No messages yet. Submit a tenant message above or wait for incoming emails.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <Card key={msg._id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">
                {msg.tenantName ?? "Unknown tenant"}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(msg.receivedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{msg.classification}</Badge>
              <Badge variant={statusVariant[msg.status]}>{msg.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{msg.body}</p>
            {msg.agentAction && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Action:</span>{" "}
                {msg.agentAction}
              </p>
            )}
            {msg.agentReply && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="text-xs font-medium text-muted-foreground mb-1">Agent reply</p>
                {msg.agentReply}
              </div>
            )}
            {msg.status === "pending" && onProcessWithAI && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onProcessWithAI(msg._id)}
                disabled={processingId === msg._id}
              >
                {processingId === msg._id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Process with AI
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
