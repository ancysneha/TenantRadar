"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wrench, 
  Droplets, 
  Zap, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  MoreVertical,
  X
} from "lucide-react";
import { format } from "date-fns";

export interface TicketTableItem {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  category: string;
  tenantName: string;
  propertyAddress: string;
  conversationId: string;
  createdAt: string;
}

interface TicketTableProps {
  tickets: TicketTableItem[];
}

export function TicketTable({ tickets: initialTickets }: TicketTableProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<TicketTableItem | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const updateTicket = async (id: string, updates: any) => {
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTickets(prev => prev.map(t => t._id === id ? { ...t, ...updates } : t));
      }
    } catch (err) {
      console.error("Failed to update ticket:", err);
    }
  };

  const openChat = async (ticket: TicketTableItem) => {
    setSelectedTicket(ticket);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/tickets/${ticket._id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Electrical": return <Zap className="h-4 w-4 text-yellow-500" />;
      case "Plumbing": return <Droplets className="h-4 w-4 text-blue-500" />;
      case "HVAC": return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <Wrench className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <Badge variant="danger" className="capitalize">High</Badge>;
      case "medium": return <Badge variant="warning" className="capitalize">Medium</Badge>;
      default: return <Badge variant="secondary" className="capitalize">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved": return <Badge variant="outline" className="border-green-500 text-green-500 capitalize">Resolved</Badge>;
      case "in_progress": return <Badge variant="outline" className="border-blue-500 text-blue-500 capitalize">In Progress</Badge>;
      default: return <Badge variant="outline" className="capitalize">Open</Badge>;
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-4 font-semibold">Tenant / Property</th>
                <th className="px-4 py-4 font-semibold">Category</th>
                <th className="px-4 py-4 font-semibold">Priority</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 font-semibold">Created Date</th>
                <th className="px-4 py-4 font-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tickets.map((ticket) => (
                <tr key={ticket._id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="font-medium text-foreground">{ticket.tenantName}</div>
                    <div className="text-xs text-muted-foreground">{ticket.propertyAddress}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(ticket.category)}
                      <span>{ticket.category}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <select 
                      value={ticket.priority} 
                      onChange={(e) => updateTicket(ticket._id, { priority: e.target.value })}
                      className="bg-transparent border-none text-xs focus:ring-0 p-0 font-medium cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <div className="mt-1">{getPriorityBadge(ticket.priority)}</div>
                  </td>
                  <td className="px-4 py-4">
                    <select 
                      value={ticket.status} 
                      onChange={(e) => updateTicket(ticket._id, { status: e.target.value })}
                      className="bg-transparent border-none text-xs focus:ring-0 p-0 font-medium cursor-pointer"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <div className="mt-1">{getStatusBadge(ticket.status)}</div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openChat(ticket)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        View Chat
                      </Button>
                      {ticket.status !== "resolved" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-green-500 hover:text-green-600 hover:bg-green-50"
                          onClick={() => updateTicket(ticket._id, { status: "resolved" })}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Chat Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border">
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedTicket.tenantName}</h3>
                  <p className="text-xs text-muted-foreground">{selectedTicket.propertyAddress}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/5">
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-6">
                <div className="font-semibold text-sm mb-1">Issue Reported:</div>
                <div className="text-sm">{selectedTicket.description}</div>
              </div>

              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Loading conversation history...</p>
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-10">No chat history available.</p>
              ) : (
                messages.map((m) => (
                  <div key={m._id} className={`flex flex-col ${m.source === "manual" ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      m.source === "manual" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      {m.body}
                    </div>
                    {m.agentReply && (
                      <div className="mt-2 max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-accent/50 border border-accent italic">
                        <span className="font-bold mr-2">AI Agent:</span>
                        {m.agentReply}
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground mt-1 px-2">
                      {format(new Date(m.receivedAt), "HH:mm")}
                    </span>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 bg-muted/30 border-t">
              <Button className="w-full" variant="outline" onClick={() => setSelectedTicket(null)}>
                Close History
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
