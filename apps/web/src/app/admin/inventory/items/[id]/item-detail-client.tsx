"use client";

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
import type {
  InventoryItemRecord,
  InventoryMovementRecord,
} from "@/lib/data/inventory";
import {
  deleteItemAction,
  recordMovementAction,
  updateItemAction,
} from "../../actions";

type SortKey = "date" | "type" | "qty" | "cost";

export function InventoryItemDetailClient({
  item,
  movements,
}: {
  item: InventoryItemRecord;
  movements: InventoryMovementRecord[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { sortKey, sortDir, toggleSort } = useSortableState<SortKey>("date");

  const sorted = useMemo(
    () =>
      sortRows(movements, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "date":
            return row.moved_on;
          case "type":
            return row.movement_type;
          case "qty":
            return row.quantity;
          case "cost":
            return row.unit_cost;
        }
      }),
    [movements, sortKey, sortDir],
  );

  async function run(
    action: (formData: FormData) => Promise<{ error?: string }>,
    formData: FormData,
    successMessage: string,
  ) {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await action(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage(successMessage);
  }

  return (
    <div className="mt-3 space-y-6">
      <div>
        <h2 className="display-font text-3xl">{item.name}</h2>
        <p className="mt-1 text-sm text-muted">
          {[item.sku, item.item_type, item.category].filter(Boolean).join(" · ")}
          {item.is_low_stock ? " · Low stock" : ""}
        </p>
        <p className="mt-2 text-lg font-semibold tabular-nums">
          {item.quantity_on_hand} {item.unit} on hand
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      <form
        className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-3"
        action={async (formData) => {
          formData.set("id", item.id);
          await run(updateItemAction, formData, "Item updated.");
        }}
      >
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required defaultValue={item.name} />
        </div>
        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" defaultValue={item.sku ?? ""} />
        </div>
        <div>
          <Label htmlFor="itemType">Type</Label>
          <select
            id="itemType"
            name="itemType"
            defaultValue={item.item_type}
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
            defaultValue={item.category}
          />
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" name="unit" defaultValue={item.unit} />
        </div>
        <div>
          <Label htmlFor="reorderLevel">Reorder level</Label>
          <Input
            id="reorderLevel"
            name="reorderLevel"
            type="number"
            min={0}
            step="0.01"
            defaultValue={item.reorder_level}
          />
        </div>
        <div>
          <Label htmlFor="unitCost">Unit cost (₹)</Label>
          <Input
            id="unitCost"
            name="unitCost"
            type="number"
            min={0}
            defaultValue={item.unit_cost}
          />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={item.location ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="isActive">Status</Label>
          <select
            id="isActive"
            name="isActive"
            defaultValue={item.is_active ? "true" : "false"}
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
          <Button type="submit" disabled={pending}>
            Save changes
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={async () => {
              if (!window.confirm("Soft-delete this item?")) return;
              const formData = new FormData();
              formData.set("id", item.id);
              await run(deleteItemAction, formData, "Item deleted.");
            }}
          >
            Delete
          </Button>
        </div>
      </form>

      <section className="space-y-3 rounded-xl border border-border p-4">
        <h3 className="font-semibold">Record movement</h3>
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          action={async (formData) => {
            formData.set("itemId", item.id);
            await run(recordMovementAction, formData, "Movement recorded.");
          }}
        >
          <div>
            <Label htmlFor="movementType">Type</Label>
            <select
              id="movementType"
              name="movementType"
              defaultValue="PURCHASE"
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="PURCHASE">Purchase</option>
              <option value="ISSUE">Issue</option>
              <option value="ADJUST">Adjust (+/−)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="0.01"
              required
              defaultValue={1}
            />
          </div>
          <div>
            <Label htmlFor="unitCost">Unit cost (₹)</Label>
            <Input
              id="unitCost"
              name="unitCost"
              type="number"
              min={0}
              defaultValue={item.unit_cost}
            />
          </div>
          <div>
            <Label htmlFor="movedOn">Date</Label>
            <Input
              id="movedOn"
              name="movedOn"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div>
            <Label htmlFor="note">Note</Label>
            <Input id="note" name="note" />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              name="postExpense"
              value="true"
              defaultChecked
            />
            Post purchase cost to expense ledger
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" size="sm" disabled={pending}>
              Save movement
            </Button>
          </div>
        </form>
        <p className="text-xs text-muted">
          For Adjust, use a negative quantity to reduce stock.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Movement history</h3>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-background text-muted">
              <tr>
                <SortableTh columnKey="date" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh columnKey="type" label="Type" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh columnKey="qty" label="Qty" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh columnKey="cost" label="Unit cost" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No movements yet.
                  </td>
                </tr>
              ) : (
                sorted.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-4 py-3 tabular-nums">
                      {row.moved_on.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">{row.movement_type}</td>
                    <td className="px-4 py-3 tabular-nums">{row.quantity}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.unit_cost != null ? formatInr(row.unit_cost) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">{row.note || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
