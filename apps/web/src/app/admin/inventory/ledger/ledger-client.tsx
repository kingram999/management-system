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
import type { InventoryLedgerRecord } from "@/lib/data/inventory";
import { createLedgerEntryAction } from "../actions";

type SortKey = "date" | "type" | "title" | "amount" | "category";

export function InventoryLedgerClient({
  entries,
}: {
  entries: InventoryLedgerRecord[];
}) {
  const [search, setSearch] = useState("");
  const [entryType, setEntryType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { sortKey, sortDir, toggleSort } = useSortableState<SortKey>("date");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((row) => {
      if (entryType && row.entry_type !== entryType) return false;
      if (!q) return true;
      const haystack = [row.title, row.category, row.note]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, search, entryType]);

  const sorted = useMemo(
    () =>
      sortRows(filtered, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "date":
            return row.entry_date;
          case "type":
            return row.entry_type;
          case "title":
            return row.title;
          case "amount":
            return row.amount;
          case "category":
            return row.category;
        }
      }),
    [filtered, sortKey, sortDir],
  );

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, row) => {
        if (row.entry_type === "INCOME") acc.income += row.amount;
        else acc.expense += row.amount;
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="display-font text-3xl">Income & expense</h2>
        <p className="mt-1 text-sm text-muted">
          Operational ledger (fees stay in the Fees module)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Income (filtered)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-brand">
            {formatInr(totals.income)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Expense (filtered)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatInr(totals.expense)}
          </p>
        </div>
      </div>

      <form
        className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2 lg:grid-cols-5"
        action={async (formData) => {
          setPending(true);
          setError(null);
          setMessage(null);
          const result = await createLedgerEntryAction(formData);
          setPending(false);
          if (result.error) {
            setError(result.error);
            return;
          }
          setMessage("Entry added.");
        }}
      >
        <div>
          <Label htmlFor="entryType">Type</Label>
          <select
            id="entryType"
            name="entryType"
            defaultValue="EXPENSE"
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required placeholder="Donation" />
        </div>
        <div>
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input id="amount" name="amount" type="number" min={1} required />
        </div>
        <div>
          <Label htmlFor="entryDate">Date</Label>
          <Input
            id="entryDate"
            name="entryDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" placeholder="Operations" />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <Label htmlFor="note">Note</Label>
          <Input id="note" name="note" />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={pending}>
            Add entry
          </Button>
        </div>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      <div className="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-2">
        <Input
          placeholder="Search title, category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={entryType}
          onChange={(e) => setEntryType(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">All types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <SortableTh columnKey="date" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="type" label="Type" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="title" label="Title" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="amount" label="Amount" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="category" label="Category" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No ledger entries yet.
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3 tabular-nums">
                    {row.entry_date.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">{row.entry_type}</td>
                  <td className="px-4 py-3 font-medium">
                    {row.title}
                    {row.linked_movement_id ? (
                      <span className="ml-2 text-xs text-muted">purchase</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatInr(row.amount)}
                  </td>
                  <td className="px-4 py-3">{row.category || "—"}</td>
                  <td className="px-4 py-3 text-muted">{row.note || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
