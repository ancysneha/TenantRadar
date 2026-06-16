import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { processMessageWithAgent } from "@/lib/agent";

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const body = await request.json();

  if (!body.messageId) {
    return NextResponse.json({ error: "messageId is required" }, { status: 400 });
  }

  try {
    const decision = await processMessageWithAgent({ messageId: body.messageId });
    return NextResponse.json(decision);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
