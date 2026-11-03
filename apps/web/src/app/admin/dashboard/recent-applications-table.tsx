"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  SortableTh,
  sortRows,
  useSortableState,
} from "@/components/sortable-table";

type ApplicationRow = {
  id: string;
  application_number: string;
  first_name: string;
  last_name: string;
  status: string;
  created_at: string;
};

type SortKey = "number" | "student" | "status";

export function RecentApplicationsTable({
  rows,
}: {
  rows: ApplicationRow[];
}) {
  const { sortKey, sortDir, toggleSort } = useSortableState<SortKey>("number");
  const sorted = useMemo(
    () =>
      sortRows(rows, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "number":
            return row.application_number;
          case "student":
            return `${row.first_name} ${row.last_name}`;
          case "status":
            return row.status;
        }
      }),
    [rows, sortKey, sortDir],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-background text-muted">
          <tr>
            <SortableTh
              columnKey="number"
              label="Number"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            />
            <SortableTh
              columnKey="student"
              label="Student"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            />
            <SortableTh
              columnKey="status"
              label="Status"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            />
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-muted">
                No applications yet. Create the first one.
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/admissions/${row.id}`}
                    className="font-medium text-brand"
                  >
                    {row.application_number}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {row.first_name} {row.last_name}
                </td>
                <td className="px-4 py-3">
                  {row.status.replaceAll("_", " ")}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
