import { Building2, Calendar, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PropertyType } from "@/models/Property";

export interface PropertyCardData {
  _id: string;
  address: string;
  unit?: string;
  type: PropertyType;
  rentDueDay: number;
}

interface PropertyCardProps {
  property: PropertyCardData;
  onDelete: (id: string) => void;
  deleting?: boolean;
}

const typeLabels: Record<PropertyType, string> = {
  apartment: "Apartment",
  house: "House",
  commercial: "Commercial",
};

export function PropertyCard({ property, onDelete, deleting }: PropertyCardProps) {
  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-lg leading-snug">{property.address}</CardTitle>
            {property.unit && (
              <p className="text-sm text-muted-foreground mt-0.5">Unit {property.unit}</p>
            )}
          </div>
        </div>
        <Badge variant="outline">{typeLabels[property.type]}</Badge>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Rent due on day {property.rentDueDay}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(property._id)}
          disabled={deleting}
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </CardContent>
    </Card>
  );
}
