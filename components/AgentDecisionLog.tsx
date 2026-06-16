import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AgentDecisionLogProps {
  decisionLog?: string;
  agentAction?: string;
}

export function AgentDecisionLog({ decisionLog, agentAction }: AgentDecisionLogProps) {
  if (!decisionLog && !agentAction) {
    return (
      <p className="text-sm text-muted-foreground">No agent decisions recorded yet.</p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agent decision log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {agentAction && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Action taken
            </p>
            <p className="text-sm mt-1">{agentAction}</p>
          </div>
        )}
        {decisionLog && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Reasoning
            </p>
            <pre className="mt-1 whitespace-pre-wrap text-sm font-sans text-muted-foreground">
              {decisionLog}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
