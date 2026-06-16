import { Badge } from "@/components/ui/badge";
import type { RentStatus } from "@/models/Tenant";

const config: Record<RentStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
  paid: { label: "Paid", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  overdue: { label: "Overdue", variant: "danger" },
};

interface RentStatusBadgeProps {
  status: RentStatus;
}

export function RentStatusBadge({ status }: RentStatusBadgeProps) {
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
