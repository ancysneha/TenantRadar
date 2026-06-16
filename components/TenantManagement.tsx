"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { TenantCard, type TenantCardData } from "@/components/TenantCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RentStatus } from "@/models/Tenant";

interface PropertyOption {
  _id: string;
  address: string;
  unit?: string;
}

interface TenantApiResponse {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  rentAmount: number;
  rentStatus: RentStatus;
  leaseStart: string;
  leaseEnd: string;
  propertyId: { _id: string; address: string; unit?: string } | string;
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function getPropertyLabel(property: PropertyOption) {
  return property.unit ? `${property.address} (${property.unit})` : property.address;
}

function parseTenant(t: TenantApiResponse): TenantCardData {
  const property =
    typeof t.propertyId === "object" && t.propertyId !== null ? t.propertyId : null;

  return {
    _id: t._id,
    name: t.name,
    email: t.email,
    phone: t.phone,
    rentAmount: t.rentAmount,
    rentStatus: t.rentStatus,
    propertyAddress: property
      ? property.unit
        ? `${property.address}, Unit ${property.unit}`
        : property.address
      : undefined,
    leaseStart: t.leaseStart,
    leaseEnd: t.leaseEnd,
  };
}

export function TenantManagement() {
  const [tenants, setTenants] = useState<TenantCardData[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [leaseStart, setLeaseStart] = useState("");
  const [leaseEnd, setLeaseEnd] = useState("");
  const [rentAmount, setRentAmount] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [tenantsRes, propertiesRes] = await Promise.all([
        fetch("/api/tenants"),
        fetch("/api/properties"),
      ]);

      if (!tenantsRes.ok) {
        const data = await tenantsRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load tenants");
      }
      if (!propertiesRes.ok) {
        const data = await propertiesRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load properties");
      }

      const tenantsData: TenantApiResponse[] = await tenantsRes.json();
      const propertiesData: PropertyOption[] = await propertiesRes.json();

      setTenants(tenantsData.map(parseTenant));
      setProperties(propertiesData);
      setPropertyId((current) => current || propertiesData[0]?._id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const amount = parseFloat(rentAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Rent amount must be a positive number");
      setSubmitting(false);
      return;
    }

    if (!propertyId) {
      setError("Please select a property");
      setSubmitting(false);
      return;
    }

    if (leaseEnd && leaseStart && new Date(leaseEnd) <= new Date(leaseStart)) {
      setError("Lease end must be after lease start");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          propertyId,
          leaseStart,
          leaseEnd,
          rentAmount: amount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create tenant");
      }

      setName("");
      setEmail("");
      setPhone("");
      setLeaseStart("");
      setLeaseEnd("");
      setRentAmount("");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tenant");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this tenant? This cannot be undone.")) return;

    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/tenants?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to delete tenant");
      }
      setTenants((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tenant");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
        <p className="text-muted-foreground mt-1">
          Manage leaseholders across your properties.
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
            Add tenant
          </CardTitle>
          <CardDescription>Register a new leaseholder to a property.</CardDescription>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add a property first before registering tenants.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyId">Property</Label>
                <select
                  id="propertyId"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className={selectClassName}
                  required
                >
                  {properties.map((property) => (
                    <option key={property._id} value={property._id}>
                      {getPropertyLabel(property)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaseStart">Lease start</Label>
                <Input
                  id="leaseStart"
                  type="date"
                  value={leaseStart}
                  onChange={(e) => setLeaseStart(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaseEnd">Lease end</Label>
                <Input
                  id="leaseEnd"
                  type="date"
                  value={leaseEnd}
                  onChange={(e) => setLeaseEnd(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="rentAmount">Rent amount ($/month)</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  placeholder="1500"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add tenant"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">Your tenants</h2>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading tenants...</span>
          </div>
        ) : tenants.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center border rounded-lg">
            No tenants yet. Add your first tenant above.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant) => (
              <TenantCard
                key={tenant._id}
                tenant={tenant}
                onDelete={handleDelete}
                deleting={deletingId === tenant._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
