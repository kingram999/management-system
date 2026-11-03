import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatInr } from "@/lib/class-levels";
import { getInventoryOverview } from "@/lib/data/inventory";

export default async function InventoryOverviewPage() {
  const profile = await requireAdmin();
  const overview = await getInventoryOverview(profile.school_id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="display-font text-3xl">Inventory</h2>
        <p className="mt-1 text-sm text-muted">
          Stock, purchases, and income vs expense
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Active items</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {overview.items}
          </p>
          <p className="mt-1 text-xs text-muted">
            {overview.supplies} supplies · {overview.assets} assets
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Low stock</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-brand">
            {overview.lowStock}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">This month</p>
          <p className="mt-1 text-sm">
            Income{" "}
            <span className="font-semibold tabular-nums">
              {formatInr(overview.incomeThisMonth)}
            </span>
          </p>
          <p className="mt-1 text-sm">
            Expense{" "}
            <span className="font-semibold tabular-nums">
              {formatInr(overview.expenseThisMonth)}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/inventory/items"
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-card"
        >
          Manage items
        </Link>
        <Link
          href="/admin/inventory/movements"
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-card"
        >
          Movements
        </Link>
        <Link
          href="/admin/inventory/ledger"
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-card"
        >
          Income & expense
        </Link>
      </div>
    </div>
  );
}
