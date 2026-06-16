"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Send,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

export interface RentTenant {
  _id: string;
  name: string;
  propertyAddress: string;
  rentAmount: number;
  rentDueDay: number;
  rentStatus: "paid" | "pending" | "overdue";
}

interface RentManagementProps {
  tenants: RentTenant[];
}

export function RentManagement({ tenants: initialTenants }: RentManagementProps) {
  const [tenants, setTenants] = useState(initialTenants);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const updateRentStatus = async (tenantId: string, status: string) => {
    setLoadingId(tenantId);
    try {
      const res = await fetch(`/api/tenants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tenantId, rentStatus: status }),
      });
      if (res.ok) {
        setTenants(prev => prev.map(t => t._id === tenantId ? { ...t, rentStatus: status as any } : t));
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "Failed to update status"}`);
      }
    } catch (err) {
      console.error("Failed to update rent status:", err);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  const sendReminder = async (tenantId: string) => {
    // In a real app, this might hit a specific endpoint or trigger the agent
    alert("AI Reminder sent to tenant via email.");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      case "overdue":
        return <Badge variant="danger">Overdue</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  const sortedTenants = [...tenants].sort((a, b) => {
    if (a.rentStatus === "overdue") return -1;
    if (b.rentStatus === "overdue") return 1;
    return a.rentDueDay - b.rentDueDay;
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rent Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${tenants.reduce((acc, t) => acc + t.rentAmount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Monthly projected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${tenants.filter(t => t.rentStatus === "paid").reduce((acc, t) => acc + t.rentAmount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${tenants.filter(t => t.rentStatus === "overdue").reduce((acc, t) => acc + t.rentAmount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Immediate action required</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Tenant</th>
              <th className="px-6 py-4 font-semibold">Property</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Due Day</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedTenants.map((tenant) => (
              <tr key={tenant._id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium">{tenant.name}</td>
                <td className="px-6 py-4 text-muted-foreground leading-none">
                  {tenant.propertyAddress}
                </td>
                <td className="px-6 py-4 font-semibold">${tenant.rentAmount}</td>
                <td className="px-6 py-4 italic text-muted-foreground">Day {tenant.rentDueDay}</td>
                <td className="px-6 py-4">{getStatusBadge(tenant.rentStatus)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {tenant.rentStatus !== "paid" ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => updateRentStatus(tenant._id, "paid")}
                          disabled={loadingId === tenant._id}
                        >
                          {loadingId === tenant._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                          Paid
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-primary hover:text-primary hover:bg-primary/5"
                          onClick={() => sendReminder(tenant._id)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Remind
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => updateRentStatus(tenant._id, "pending")}
                        disabled={loadingId === tenant._id}
                      >
                        Reset
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
  );
}
