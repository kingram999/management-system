"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  SortableTh,
  sortRows,
  useSortableState,
} from "@/components/sortable-table";
import { Input } from "@/components/ui/input";
import { formatInr } from "@/lib/class-levels";
import type { InventoryMovementRecord } from "@/lib/data/inventory";

type SortKey = "date" | "item" | "type" | "qty" | "cost";

export function InventoryMovementsClient({
  movements,
}: {
  movements: InventoryMovementRecord[];
}) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const { sortKey, sortDir, toggleSort } = useSortableState<SortKey>("date");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return movements.filter((row) => {
      if (type && row.movement_type !== type) return false;
      if (!q) return true;
      const haystack = [row.item_name, row.item_sku, row.note, row.recorded_by_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [movements, search, type]);

  const sorted = useMemo(
    () =>
      sortRows(filtered, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "date":
            return row.moved_on;
          case "item":
            return row.item_name;
          case "type":
            return row.movement_type;
          case "qty":
            return row.quantity;
          case "cost":
            return row.unit_cost;
        }
      }),
    [filtered, sortKey, sortDir],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="display-font text-3xl">Movements</h2>
        <p className="mt-1 text-sm text-muted">
          Purchases, issues, and adjustments across all items
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-2">
        <Input
          placeholder="Search item, note, recorder…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">All types</option>
          <option value="PURCHASE">Purchase</option>
          <option value="ISSUE">Issue</option>
          <option value="ADJUST">Adjust</option>
        </select>
      </div>

      <p className="text-sm text-muted tabular-nums">
        {sorted.length} movements
      </p>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <SortableTh columnKey="date" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="item" label="Item" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="type" label="Type" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="qty" label="Qty" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="cost" label="Unit cost" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No movements yet.
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3 tabular-nums">
                    {row.moved_on.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/inventory/items/${row.item_id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {row.item_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.movement_type}</td>
                  <td className="px-4 py-3 tabular-nums">{row.quantity}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {row.unit_cost != null ? formatInr(row.unit_cost) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">{row.note || "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {row.recorded_by_name || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
