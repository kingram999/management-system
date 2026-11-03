import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  getInventoryItem,
  listInventoryMovements,
} from "@/lib/data/inventory";
import { InventoryItemDetailClient } from "./item-detail-client";

export default async function InventoryItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireAdmin();
  const [item, movements] = await Promise.all([
    getInventoryItem(profile.school_id, id),
    listInventoryMovements(profile.school_id, id),
  ]);

  if (!item) notFound();

  return (
    <div>
      <Link href="/admin/inventory/items" className="text-sm text-brand">
        ← Back to items
      </Link>
      <InventoryItemDetailClient item={item} movements={movements} />
    </div>
  );
}
