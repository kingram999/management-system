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
import type { StudentFeeBalance } from "@/lib/data/fees";

type DuesSortKey =
  | "name"
  | "class"
  | "section"
  | "billed"
  | "paid"
  | "pending"
  | "status";

type ClassOption = {
  id: string;
  name: string;
  sections: Array<{ id: string; name: string }>;
};

function dueStatus(row: StudentFeeBalance) {
  if (row.billed <= 0) return "No fee";
  if (row.pending <= 0) return "Paid";
  if (row.paid > 0) return "Partial";
  return "Due";
}

export function FeeDuesClient({
  rows,
  classes,
}: {
  rows: StudentFeeBalance[];
  classes: ClassOption[];
}) {
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState("");
  const { sortKey, sortDir, toggleSort } = useSortableState<DuesSortKey>("name");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filteredRows = rows.filter((row) => {
      if (classId && row.classId !== classId) return false;
      const label = dueStatus(row);
      if (status && label !== status) return false;
      if (!q) return true;
      const haystack = [
        row.firstName,
        row.lastName,
        `${row.firstName} ${row.lastName}`,
        row.admissionNumber,
        row.className,
        row.sectionName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
    return sortRows(filteredRows, sortKey, sortDir, (row, key) => {
      switch (key) {
        case "name":
          return `${row.firstName} ${row.lastName}`;
        case "class":
          return row.className;
        case "section":
          return row.sectionName;
        case "billed":
          return row.billed;
        case "paid":
          return row.paid;
        case "pending":
          return row.pending;
        case "status":
          return dueStatus(row);
      }
    });
  }, [rows, search, classId, status, sortKey, sortDir]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="display-font text-3xl">Student dues</h2>
          <p className="mt-1 text-sm text-muted">
            Billed, paid, and pending annual fees
          </p>
        </div>
        <Link
          href="/admin/fees/collect"
          className="inline-flex items-center justify-center rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Collect payment
        </Link>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-3">
        <Input
          placeholder="Search name or reg. ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">All classes</option>
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">All payment statuses</option>
          <option value="Due">Due</option>
          <option value="Partial">Partial</option>
          <option value="Paid">Paid</option>
          <option value="No fee">No fee</option>
        </select>
      </div>

      <p className="text-sm text-muted tabular-nums">
        {filtered.length} students
      </p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <SortableTh columnKey="name" label="Name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
              <SortableTh columnKey="class" label="Class" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
              <SortableTh columnKey="section" label="Section" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
              <SortableTh columnKey="billed" label="Billed" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
              <SortableTh columnKey="paid" label="Paid" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
              <SortableTh columnKey="pending" label="Pending" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
              <SortableTh columnKey="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
              <th className="px-3 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">
                  No students match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.studentId}
                  className="border-t border-border hover:bg-background/70"
                >
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/students/${row.studentId}`}
                      className="font-medium"
                    >
                      {row.firstName} {row.lastName}
                    </Link>
                    <p className="text-xs tabular-nums text-muted">
                      {row.admissionNumber}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {row.className || "—"}
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {row.sectionName || "—"}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-muted">
                    {formatInr(row.billed)}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-muted">
                    {formatInr(row.paid)}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-muted">
                    {formatInr(row.pending)}
                  </td>
                  <td className="px-3 py-3 text-muted">{dueStatus(row)}</td>
                  <td className="px-3 py-3">
                    {row.pending > 0 ? (
                      <Link
                        href={`/admin/fees/collect?studentId=${row.studentId}`}
                        className="text-sm text-brand underline"
                      >
                        Collect
                      </Link>
                    ) : (
                      <span className="text-sm text-muted">—</span>
                    )}
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
