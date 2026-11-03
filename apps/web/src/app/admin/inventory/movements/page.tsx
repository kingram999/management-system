import { requireAdmin } from "@/lib/auth";
import { listInventoryMovements } from "@/lib/data/inventory";
import { InventoryMovementsClient } from "./movements-client";

export default async function InventoryMovementsPage() {
  const profile = await requireAdmin();
  const movements = await listInventoryMovements(profile.school_id);
  return <InventoryMovementsClient movements={movements} />;
}
