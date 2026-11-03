"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  SortableTh,
  sortRows,
  useSortableState,
} from "@/components/sortable-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatInr } from "@/lib/class-levels";
import type { InventoryItemRecord } from "@/lib/data/inventory";
import { createItemAction } from "../actions";

type SortKey =
  | "name"
  | "sku"
  | "type"
  | "category"
  | "qty"
  | "reorder"
  | "cost"
  | "status";

export function InventoryItemsClient({
  items,
}: {
  items: InventoryItemRecord[];
}) {
  const [search, setSearch] = useState("");
  const [itemType, setItemType] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { sortKey, sortDir, toggleSort } = useSortableState<SortKey>("name");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((row) => {
      if (itemType && row.item_type !== itemType) return false;
      if (lowOnly && !row.is_low_stock) return false;
      if (!q) return true;
      const haystack = [row.name, row.sku, row.category, row.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, search, itemType, lowOnly]);

  const sorted = useMemo(
    () =>
      sortRows(filtered, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "name":
            return row.name;
          case "sku":
            return row.sku;
          case "type":
            return row.item_type;
          case "category":
            return row.category;
          case "qty":
            return row.quantity_on_hand;
          case "reorder":
            return row.reorder_level;
          case "cost":
            return row.unit_cost;
          case "status":
            return row.is_active ? "Active" : "Inactive";
        }
      }),
    [filtered, sortKey, sortDir],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="display-font text-3xl">Items</h2>
          <p className="mt-1 text-sm text-muted">
            Supplies and assets in the school store
          </p>
        </div>
        <Button type="button" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "Close form" : "Add item"}
        </Button>
      </div>

      {showAdd ? (
        <form
          className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
          action={async (formData) => {
            setPending(true);
            setError(null);
            setMessage(null);
            const result = await createItemAction(formData);
            setPending(false);
            if (result.error) {
              setError(result.error);
              return;
            }
            setMessage("Item added.");
            setShowAdd(false);
          }}
        >
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="A4 Paper" />
          </div>
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" placeholder="STN-001" />
          </div>
          <div>
            <Label htmlFor="itemType">Type</Label>
            <select
              id="itemType"
              name="itemType"
              defaultValue="SUPPLY"
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="SUPPLY">Supply</option>
              <option value="ASSET">Asset</option>
            </select>
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              name="category"
              required
              placeholder="Stationery"
            />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" name="unit" defaultValue="pcs" />
          </div>
          <div>
            <Label htmlFor="quantityOnHand">Opening qty</Label>
            <Input
              id="quantityOnHand"
              name="quantityOnHand"
              type="number"
              min={0}
              step="0.01"
              defaultValue={0}
            />
          </div>
          <div>
            <Label htmlFor="reorderLevel">Reorder level</Label>
            <Input
              id="reorderLevel"
              name="reorderLevel"
              type="number"
              min={0}
              step="0.01"
              defaultValue={0}
            />
          </div>
          <div>
            <Label htmlFor="unitCost">Unit cost (₹)</Label>
            <Input
              id="unitCost"
              name="unitCost"
              type="number"
              min={0}
              defaultValue={0}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="Store room" />
          </div>
          <div className="flex items-end sm:col-span-2">
            <Button type="submit" disabled={pending}>
              Save item
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-3">
        <Input
          placeholder="Search name, SKU, category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={itemType}
          onChange={(e) => setItemType(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">All types</option>
          <option value="SUPPLY">Supply</option>
          <option value="ASSET">Asset</option>
        </select>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
          />
          Low stock only
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      <p className="text-sm text-muted tabular-nums">{sorted.length} items</p>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <SortableTh columnKey="name" label="Name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="sku" label="SKU" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="type" label="Type" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="category" label="Category" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="qty" label="Qty" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="reorder" label="Reorder" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="cost" label="Unit cost" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  No items match these filters.
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/inventory/items/${row.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {row.name}
                    </Link>
                    {row.is_low_stock ? (
                      <span className="ml-2 text-xs text-accent">Low</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{row.sku || "—"}</td>
                  <td className="px-4 py-3">{row.item_type}</td>
                  <td className="px-4 py-3">{row.category}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {row.quantity_on_hand} {row.unit}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{row.reorder_level}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatInr(row.unit_cost)}
                  </td>
                  <td className="px-4 py-3">
                    {row.is_active ? "Active" : "Inactive"}
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
