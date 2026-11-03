import { requireAdmin } from "@/lib/auth";
import { listInventoryItems } from "@/lib/data/inventory";
import { InventoryItemsClient } from "./items-client";

export default async function InventoryItemsPage() {
  const profile = await requireAdmin();
  const items = await listInventoryItems(profile.school_id);
  return <InventoryItemsClient items={items} />;
}
