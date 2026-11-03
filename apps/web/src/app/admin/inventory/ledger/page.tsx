import { requireAdmin } from "@/lib/auth";
import { listLedgerEntries } from "@/lib/data/inventory";
import { InventoryLedgerClient } from "./ledger-client";

export default async function InventoryLedgerPage() {
  const profile = await requireAdmin();
  const entries = await listLedgerEntries(profile.school_id);
  return <InventoryLedgerClient entries={entries} />;
}
