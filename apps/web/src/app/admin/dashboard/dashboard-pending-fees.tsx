"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  SortableTh,
  sortRows,
  useSortableState,
} from "@/components/sortable-table";
import { formatInr } from "@/lib/class-levels";
import type { StudentFeeBalance } from "@/lib/data/fees";

type SortKey = "student" | "class" | "pending";

export function DashboardPendingFees({
  rows,
}: {
  rows: StudentFeeBalance[];
}) {
  const { sortKey, sortDir, toggleSort } = useSortableState<SortKey>("pending");
  const sorted = useMemo(
    () =>
      sortRows(rows, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "student":
            return `${row.firstName} ${row.lastName}`;
          case "class":
            return [row.className, row.sectionName].filter(Boolean).join(" ");
          case "pending":
            return row.pending;
        }
      }),
    [rows, sortKey, sortDir],
  );

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Fee payment pending</h3>
          <p className="mt-1 text-sm text-muted">
            Students with outstanding annual fees
          </p>
        </div>
        <Link href="/admin/fees/dues" className="text-sm text-brand">
          View all
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <SortableTh
                columnKey="student"
                label="Student"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                columnKey="class"
                label="Class"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                columnKey="pending"
                label="Pending"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  No pending fee payments.
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr key={row.studentId} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {row.firstName} {row.lastName}
                    </p>
                    <p className="text-xs text-muted">{row.admissionNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    {[row.className, row.sectionName].filter(Boolean).join(" · ") ||
                      "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-medium">
                    {formatInr(row.pending)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/fees/collect?studentId=${row.studentId}`}
                      className="text-sm text-brand"
                    >
                      Collect
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
