"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SortableTh,
  sortRows,
  useSortableState,
} from "@/components/sortable-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  AttendanceStatus,
  EmployeeAttendanceRow,
} from "@/lib/data/employees";
import { saveEmployeeAttendanceAction } from "../actions";

type SortKey = "name" | "code" | "designation" | "category" | "status";

const STATUS_OPTIONS: Array<{ value: AttendanceStatus; label: string }> = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
  { value: "LEAVE", label: "Leave" },
];

export function EmployeeAttendanceClient({
  initialDate,
  initialRows,
  lastMarkedByName,
}: {
  initialDate: string;
  initialRows: EmployeeAttendanceRow[];
  lastMarkedByName: string | null;
}) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>(() => {
    const map: Record<string, AttendanceStatus> = {};
    for (const row of initialRows) map[row.employeeId] = row.status;
    return map;
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { sortKey, sortDir, toggleSort } = useSortableState<SortKey>("name");

  useEffect(() => {
    const map: Record<string, AttendanceStatus> = {};
    for (const row of initialRows) map[row.employeeId] = row.status;
    setMarks(map);
  }, [initialRows]);

  const sortedRows = useMemo(
    () =>
      sortRows(initialRows, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "name":
            return `${row.lastName} ${row.firstName}`;
          case "code":
            return row.employeeCode;
          case "designation":
            return row.designation;
          case "category":
            return row.category;
          case "status":
            return marks[row.employeeId] ?? row.status;
        }
      }),
    [initialRows, sortKey, sortDir, marks],
  );

  function loadDate(nextDate: string) {
    setDate(nextDate);
    router.push(`/admin/employees/attendance?date=${nextDate}`);
  }

  function markAll(status: AttendanceStatus) {
    const next: Record<string, AttendanceStatus> = {};
    for (const row of initialRows) next[row.employeeId] = status;
    setMarks(next);
  }

  async function save() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await saveEmployeeAttendanceAction({
      date,
      marks: initialRows.map((row) => ({
        employeeId: row.employeeId,
        status: marks[row.employeeId] ?? row.status,
      })),
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage("Attendance saved.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="display-font text-3xl">Staff attendance</h2>
        <p className="mt-1 text-sm text-muted">
          Mark attendance for active employees
          {lastMarkedByName ? ` · last marked by ${lastMarkedByName}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-background p-4">
        <div>
          <Label htmlFor="attendance-date">Date</Label>
          <Input
            id="attendance-date"
            type="date"
            value={date}
            onChange={(e) => loadDate(e.target.value)}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => markAll("PRESENT")}
        >
          All present
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => markAll("ABSENT")}
        >
          All absent
        </Button>
        <Button type="button" onClick={save} disabled={loading}>
          Save attendance
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <SortableTh
                columnKey="name"
                label="Employee"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                columnKey="code"
                label="Code"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                columnKey="designation"
                label="Designation"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                columnKey="category"
                label="Category"
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
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No active employees to mark.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr key={row.employeeId} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted">
                    {row.employeeCode || "—"}
                  </td>
                  <td className="px-4 py-3">{row.designation}</td>
                  <td className="px-4 py-3">{row.category}</td>
                  <td className="px-4 py-3">
                    <select
                      value={marks[row.employeeId] ?? row.status}
                      onChange={(e) =>
                        setMarks((prev) => ({
                          ...prev,
                          [row.employeeId]: e.target
                            .value as AttendanceStatus,
                        }))
                      }
                      className="h-9 rounded-lg border border-border bg-card px-2 text-sm"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
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
