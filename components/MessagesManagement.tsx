"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { ConversationList, type ConversationListItem } from "@/components/ConversationList";
import { ConversationThread, type ThreadMessage } from "@/components/ConversationThread";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MessageClassification, MessageStatus } from "@/models/Message";

interface TenantOption {
  _id: string;
  name: string;
  email: string;
}

interface ConversationApiResponse {
  _id: string;
  tenantId: { _id: string; name: string; email: string } | string;
  status: string;
  lastMessageAt: string;
  latestMessage?: {
    body: string;
    status: MessageStatus;
    classification: MessageClassification;
    receivedAt: string;
  } | null;
  pendingCount: number;
}

interface ThreadMessageApiResponse {
  _id: string;
  body: string;
  receivedAt: string;
  classification: MessageClassification;
  status: MessageStatus;
  agentAction?: string;
  agentReply?: string;
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function parseConversation(item: ConversationApiResponse): ConversationListItem {
  const tenant =
    typeof item.tenantId === "object" && item.tenantId !== null ? item.tenantId : null;

  return {
    _id: item._id,
    tenantName: tenant?.name ?? "Unknown tenant",
    tenantEmail: tenant?.email ?? "",
    lastMessageAt: item.lastMessageAt,
    latestMessage: item.latestMessage ?? null,
    pendingCount: item.pendingCount,
  };
}

function parseThreadMessage(msg: ThreadMessageApiResponse): ThreadMessage {
  return {
    _id: msg._id,
    body: msg.body,
    receivedAt: msg.receivedAt,
    classification: msg.classification,
    status: msg.status,
    agentAction: msg.agentAction,
    agentReply: msg.agentReply,
  };
}

export function MessagesManagement() {
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedTenantName, setSelectedTenantName] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [replying, setReplying] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [tenantId, setTenantId] = useState("");
  const [body, setBody] = useState("");

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to load conversations");
    }
    const data: ConversationApiResponse[] = await res.json();
    return data.map(parseConversation);
  }, []);

  const fetchTenants = useCallback(async () => {
    const res = await fetch("/api/tenants");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to load tenants");
    }
    const data: TenantOption[] = await res.json();
    setTenants(data);
    setTenantId((current) => current || data[0]?._id || "");
  }, []);

  const fetchThread = useCallback(async (conversationId: string) => {
    setLoadingThread(true);
    setError(null);

    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load conversation");
      }

      const data: {
        conversation: { _id: string; tenantId: { _id: string; name: string; email: string } };
        messages: ThreadMessageApiResponse[];
      } = await res.json();

      const tenant =
        typeof data.conversation.tenantId === "object"
          ? data.conversation.tenantId
          : null;

      setSelectedTenantName(tenant?.name ?? "Unknown tenant");
      setSelectedTenantId(tenant?._id ?? "");
      setThreadMessages(data.messages.map(parseThreadMessage));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversation");
    } finally {
      setLoadingThread(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    const list = await fetchConversations();
    setConversations(list);
    if (selectedConversationId) {
      await fetchThread(selectedConversationId);
    }
  }, [fetchConversations, fetchThread, selectedConversationId]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        await fetchTenants();
        const list = await fetchConversations();
        setConversations(list);
        if (list.length > 0) {
          setSelectedConversationId(list[0]._id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetchTenants, fetchConversations]);

  useEffect(() => {
    if (selectedConversationId) {
      fetchThread(selectedConversationId);
    }
  }, [selectedConversationId, fetchThread]);

  async function handleNewMessageSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!tenantId || !body.trim()) {
      setError("Tenant and message are required");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          body: body.trim(),
          source: "manual",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to submit message");
      }

      const conversationId =
        typeof data.conversationId === "object"
          ? data.conversationId._id
          : data.conversationId;

      setBody("");
      setSelectedConversationId(conversationId);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit message");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReplyAsTenant(messageBody: string) {
    if (!selectedConversationId || !selectedTenantId) return;

    setReplying(true);
    setError(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedTenantId,
          conversationId: selectedConversationId,
          body: messageBody,
          source: "manual",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to send tenant reply");
      }

      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send tenant reply");
    } finally {
      setReplying(false);
    }
  }

  async function handleProcessWithAI(messageId: string) {
    setProcessingId(messageId);
    setError(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to process message with AI");
      }

      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process message with AI");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Conversation-based tenant messaging with your local AI agent.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Start conversation
          </CardTitle>
          <CardDescription>
            Submit a tenant message. It joins the active conversation thread for that tenant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add a tenant first before starting conversations.
            </p>
          ) : (
            <form onSubmit={handleNewMessageSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenantId">Tenant</Label>
                <select
                  id="tenantId"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className={selectClassName}
                  required
                >
                  {tenants.map((tenant) => (
                    <option key={tenant._id} value={tenant._id}>
                      {tenant.name} ({tenant.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="e.g. The kitchen sink is leaking..."
                  required
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit message"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto">
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversationId}
              onSelect={setSelectedConversationId}
              loading={loading}
            />
          </CardContent>
        </Card>

        {selectedConversationId ? (
          loadingThread ? (
            <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading conversation...</span>
            </div>
          ) : (
            <ConversationThread
              tenantName={selectedTenantName}
              messages={threadMessages}
              onProcessWithAI={handleProcessWithAI}
              onReplyAsTenant={handleReplyAsTenant}
              processingId={processingId}
              replying={replying}
            />
          )
        ) : (
          <Card className="flex items-center justify-center min-h-[520px]">
            <p className="text-sm text-muted-foreground">
              Select a conversation to view the chat thread.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
