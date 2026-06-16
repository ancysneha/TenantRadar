import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AIActivity } from "@/lib/ai-activity";

interface AIActivityFeedProps {
  activities: AIActivity[];
}

export function AIActivityFeed({ activities }: AIActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Recent AI Actions
        </CardTitle>
        <CardDescription>
          Latest automated actions from your property management agent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No AI actions yet. Process a tenant message to see activity here.
          </p>
        ) : (
          <ul className="space-y-4">
            {activities.map((activity) => (
              <li
                key={activity.id}
                className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0"
              >
                <p className="text-sm text-foreground">{activity.description}</p>
                <time
                  dateTime={activity.timestamp.toISOString()}
                  className="shrink-0 text-xs text-muted-foreground whitespace-nowrap"
                >
                  {activity.timestamp.toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
