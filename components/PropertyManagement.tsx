"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PropertyType } from "@/models/Property";

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "commercial", label: "Commercial" },
];

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function PropertyManagement() {
  const [properties, setProperties] = useState<PropertyCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [address, setAddress] = useState("");
  const [unit, setUnit] = useState("");
  const [type, setType] = useState<PropertyType>("apartment");
  const [rentDueDay, setRentDueDay] = useState("1");

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/properties");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load properties");
      }
      const data: Array<Omit<PropertyCardData, "_id"> & { _id: string }> = await res.json();
      setProperties(
        data.map((p) => ({
          _id: p._id,
          address: p.address,
          unit: p.unit,
          type: p.type,
          rentDueDay: p.rentDueDay,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const day = parseInt(rentDueDay, 10);
    if (Number.isNaN(day) || day < 1 || day > 28) {
      setError("Rent due day must be between 1 and 28");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address.trim(),
          unit: unit.trim() || undefined,
          type,
          rentDueDay: day,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create property");
      }

      setAddress("");
      setUnit("");
      setType("apartment");
      setRentDueDay("1");
      await fetchProperties();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create property");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this property? This cannot be undone.")) return;

    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/properties?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to delete property");
      }
      setProperties((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete property");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
        <p className="text-muted-foreground mt-1">
          Add and manage rental properties across your portfolio.
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
            Add property
          </CardTitle>
          <CardDescription>Register a new rental unit to your portfolio.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Apt 4B (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Property type</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as PropertyType)}
                className={selectClassName}
              >
                {PROPERTY_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rentDueDay">Rent due day (1–28)</Label>
              <Input
                id="rentDueDay"
                type="number"
                min={1}
                max={28}
                value={rentDueDay}
                onChange={(e) => setRentDueDay(e.target.value)}
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
                  "Add property"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">Your properties</h2>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading properties...</span>
          </div>
        ) : properties.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center border rounded-lg">
            No properties yet. Add your first property above.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                onDelete={handleDelete}
                deleting={deletingId === property._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
