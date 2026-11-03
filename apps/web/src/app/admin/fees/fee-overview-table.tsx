"use client";

import { useMemo } from "react";
import {
  SortableTh,
  sortRows,
  useSortableState,
} from "@/components/sortable-table";
import { formatInr } from "@/lib/class-levels";

type FeeClassRow = {
  classId: string | null;
  className: string;
  studentCount: number;
  billed: number;
  collected: number;
  pending: number;
};

type SortKey = "class" | "students" | "billed" | "collected" | "pending";

export function FeeOverviewTable({ rows }: { rows: FeeClassRow[] }) {
  const { sortKey, sortDir, toggleSort } = useSortableState<SortKey>("class");
  const sorted = useMemo(
    () =>
      sortRows(rows, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "class":
            return row.className;
          case "students":
            return row.studentCount;
          case "billed":
            return row.billed;
          case "collected":
            return row.collected;
          case "pending":
            return row.pending;
        }
      }),
    [rows, sortKey, sortDir],
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-background text-muted">
          <tr>
            <SortableTh
              columnKey="class"
              label="Class"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
              className="px-3 py-3 font-medium"
            />
            <SortableTh
              columnKey="students"
              label="Students"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
              className="px-3 py-3 font-medium"
            />
            <SortableTh
              columnKey="billed"
              label="Billed"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
              className="px-3 py-3 font-medium"
            />
            <SortableTh
              columnKey="collected"
              label="Collected"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
              className="px-3 py-3 font-medium"
            />
            <SortableTh
              columnKey="pending"
              label="Pending"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
              className="px-3 py-3 font-medium"
            />
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-muted">
                No active students with fee data yet.
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr
                key={row.classId ?? row.className}
                className="border-t border-border"
              >
                <td className="px-3 py-3 font-medium">{row.className}</td>
                <td className="px-3 py-3 tabular-nums text-muted">
                  {row.studentCount}
                </td>
                <td className="px-3 py-3 tabular-nums text-muted">
                  {formatInr(row.billed)}
                </td>
                <td className="px-3 py-3 tabular-nums text-muted">
                  {formatInr(row.collected)}
                </td>
                <td className="px-3 py-3 tabular-nums text-muted">
                  {formatInr(row.pending)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
