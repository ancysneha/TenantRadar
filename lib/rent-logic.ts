import Tenant from "@/models/Tenant";
import { connectDB } from "./mongodb";

/**
 * Automatically updates tenant rent statuses based on the calendar cycle.
 * - Resets 'paid' tenants to 'pending' if a new month has started.
 * - Marks 'pending' tenants as 'overdue' if the current day is past their rentDueDay.
 */
export async function refreshTenantStatuses(propertyIds: any[]) {
  if (!propertyIds || propertyIds.length === 0) return;

  await connectDB();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentDay = now.getDate();

  const tenants = await Tenant.find({ propertyId: { $in: propertyIds } });

  const updatePromises = tenants.map(async (tenant) => {
    // updatedAt is automatically managed by Mongoose timestamps
    const lastUpdate = new Date(tenant.updatedAt || tenant.createdAt);
    const lastUpdateMonth = lastUpdate.getMonth();
    const lastUpdateYear = lastUpdate.getFullYear();

    let currentStatus = tenant.rentStatus;
    let needsUpdate = false;

    // 1. Monthly Reset: If we've moved to a new month since the last status update,
    // and the tenant was 'paid', reset them to 'pending'.
    // If they were 'overdue', they remain 'overdue' until they pay.
    if (
      currentStatus === "paid" &&
      (lastUpdateMonth !== currentMonth || lastUpdateYear !== currentYear)
    ) {
      currentStatus = "pending";
      needsUpdate = true;
    }

    // 2. Overdue Detection: If status is 'pending' and we are past the due day,
    // transition them to 'overdue'.
    if (currentStatus === "pending" && currentDay > tenant.rentDueDay) {
      currentStatus = "overdue";
      needsUpdate = true;
    }

    if (needsUpdate) {
      tenant.rentStatus = currentStatus;
      return tenant.save();
    }
    return Promise.resolve(null);
  });

  await Promise.all(updatePromises);
}
