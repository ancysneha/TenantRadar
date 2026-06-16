import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Tenant from "@/models/Tenant";
import Property from "@/models/Property";
import { sendEmail } from "@/lib/gmail";
import { generateRentReminder } from "@/lib/agent";

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const today = new Date();
  const dayOfMonth = today.getDate();

  // 1. Mark as overdue if today is past the due day and status is pending
  const overdueResult = await Tenant.updateMany(
    {
      rentDueDay: { $lt: dayOfMonth },
      rentStatus: "pending",
    },
    {
      $set: { rentStatus: "overdue" },
    }
  );

  // 2. Find tenants who need reminders (either due today or already overdue)
  const tenants = await Tenant.find({
    $or: [
      { rentDueDay: dayOfMonth, rentStatus: "pending" },
      { rentStatus: "overdue" }
    ],
  }).populate("propertyId");

  const results: { tenantId: string; email: string; sent: boolean; action: string }[] = [];

  for (const tenant of tenants) {
    const property = tenant.propertyId as { address?: string };
    const address = property?.address ?? "your unit";
    
    const message = generateRentReminder(tenant.name, tenant.rentAmount, address, tenant.rentStatus);

    try {
      if (tenant.email) {
        await sendEmail({
          to: tenant.email,
          subject: tenant.rentStatus === "overdue" ? "URGENT: Rent Overdue" : "Rent Payment Reminder",
          text: message,
        });
        results.push({ 
          tenantId: tenant._id.toString(), 
          email: tenant.email, 
          sent: true,
          action: tenant.rentStatus === "overdue" ? "escalated_reminder" : "standard_reminder"
        });
      }
    } catch {
      results.push({ tenantId: tenant._id.toString(), email: tenant.email, sent: false, action: "failed_email" });
    }
  }

  return NextResponse.json({
    date: today.toISOString(),
    overdueUpdated: overdueResult.modifiedCount,
    remindersProcessed: results.length,
    details: results,
  });
}
