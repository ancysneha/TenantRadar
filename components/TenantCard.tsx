import { Calendar, Mail, Phone, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RentStatusBadge } from "@/components/RentStatusBadge";
import type { RentStatus } from "@/models/Tenant";

export interface TenantCardData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  rentAmount: number;
  rentStatus: RentStatus;
  propertyAddress?: string;
  leaseStart?: string;
  leaseEnd?: string;
}

interface TenantCardProps {
  tenant: TenantCardData;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}

function formatDate(date?: string) {
  if (!date) return null;
  return new Date(date).toLocaleDateString();
}

export function TenantCard({ tenant, onDelete, deleting }: TenantCardProps) {
  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">{tenant.name}</CardTitle>
        <RentStatusBadge status={tenant.rentStatus} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {tenant.email}
          </p>
          {tenant.phone && (
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {tenant.phone}
            </p>
          )}
          {tenant.propertyAddress && (
            <p className="text-foreground/80">{tenant.propertyAddress}</p>
          )}
          {(tenant.leaseStart || tenant.leaseEnd) && (
            <p className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatDate(tenant.leaseStart)} – {formatDate(tenant.leaseEnd)}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between pt-1">
          <p className="font-medium text-foreground">
            ${tenant.rentAmount.toLocaleString()} / month
          </p>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(tenant._id)}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
