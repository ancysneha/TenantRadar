"use client";

import { FormEvent, useState } from "react";
import { Loader2, MessageSquareReply, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { MessageClassification, MessageStatus } from "@/models/Message";

export interface ThreadMessage {
  _id: string;
  body: string;
  receivedAt: string;
  classification: MessageClassification;
  status: MessageStatus;
  agentAction?: string;
  agentReply?: string;
}

interface ConversationThreadProps {
  tenantName: string;
  messages: ThreadMessage[];
  onProcessWithAI: (messageId: string) => Promise<void>;
  onReplyAsTenant: (body: string) => Promise<void>;
  processingId: string | null;
  replying: boolean;
}

export function ConversationThread({
  tenantName,
  messages,
  onProcessWithAI,
  onReplyAsTenant,
  processingId,
  replying,
}: ConversationThreadProps) {
  const [replyBody, setReplyBody] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);

  async function handleReplySubmit(e: FormEvent) {
    e.preventDefault();
    if (!replyBody.trim()) return;
    await onReplyAsTenant(replyBody.trim());
    setReplyBody("");
    setShowReplyForm(false);
  }

  return (
    <Card className="flex flex-col h-full min-h-[520px]">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquareReply className="h-5 w-5" />
          Conversation with {tenantName}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No messages in this conversation yet.
            </p>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className="space-y-3">
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg rounded-tl-none bg-muted px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {tenantName}
                    </p>
                    <p className="text-sm">{msg.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(msg.receivedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {msg.agentReply ? (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg rounded-tr-none bg-primary text-primary-foreground px-4 py-3">
                      <p className="text-xs font-medium opacity-80 mb-1">TenantRadar AI</p>
                      <p className="text-sm whitespace-pre-wrap">{msg.agentReply}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs bg-primary-foreground/20">
                          {msg.classification}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-primary-foreground/20">
                          {msg.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : msg.status === "pending" ? (
                  <div className="flex justify-end">
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
                  </div>
                ) : null}

                {msg.agentAction && (
                  <p className="text-xs text-muted-foreground text-center">
                    Action: {msg.agentAction}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <div className="border-t p-4">
          {!showReplyForm ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowReplyForm(true)}
            >
              Reply as Tenant
            </Button>
          ) : (
            <form onSubmit={handleReplySubmit} className="space-y-3">
              <Textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Enter a follow-up message as the tenant..."
                required
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={replying} className={cn("flex-1")}>
                  {replying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send tenant reply"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyBody("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
