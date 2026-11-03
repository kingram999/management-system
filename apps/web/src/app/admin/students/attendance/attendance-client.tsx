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
  AttendanceSheetRow,
  AttendanceStatus,
} from "@/lib/data/attendance";
import { saveAttendanceAction } from "./actions";

type AttendanceSortKey = "roll" | "name" | "reg" | "status";

type ClassOption = {
  id: string;
  name: string;
  sections: Array<{ id: string; name: string }>;
};

const STATUS_OPTIONS: Array<{ value: AttendanceStatus; label: string }> = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
  { value: "LEAVE", label: "Leave" },
];

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function AttendanceClient({
  classes,
  initialDate,
  initialClassId,
  initialSectionId,
  initialRows,
  lastMarkedByName,
}: {
  classes: ClassOption[];
  initialDate: string;
  initialClassId: string;
  initialSectionId: string;
  initialRows: AttendanceSheetRow[];
  lastMarkedByName: string | null;
}) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate || todayInputValue());
  const [classId, setClassId] = useState(initialClassId);
  const [sectionId, setSectionId] = useState(initialSectionId);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>(() => {
    const map: Record<string, AttendanceStatus> = {};
    for (const row of initialRows) map[row.studentId] = row.status;
    return map;
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sections = useMemo(() => {
    return classes.find((item) => item.id === classId)?.sections ?? [];
  }, [classes, classId]);
  const { sortKey, sortDir, toggleSort } =
    useSortableState<AttendanceSortKey>("roll");
  const sortedRows = useMemo(
    () =>
      sortRows(initialRows, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "roll":
            return row.rollNumber;
          case "name":
            return `${row.firstName} ${row.lastName}`;
          case "reg":
            return row.admissionNumber;
          case "status":
            return marks[row.studentId] ?? row.status;
        }
      }),
    [initialRows, sortKey, sortDir, marks],
  );

  useEffect(() => {
    const map: Record<string, AttendanceStatus> = {};
    for (const row of initialRows) map[row.studentId] = row.status;
    setMarks(map);
  }, [initialRows]);

  function loadSheet(next: {
    date?: string;
    classId?: string;
    sectionId?: string;
  }) {
    const d = next.date ?? date;
    const c = next.classId ?? classId;
    const s = next.sectionId ?? sectionId;
    const params = new URLSearchParams();
    if (d) params.set("date", d);
    if (c) params.set("classId", c);
    if (s) params.set("sectionId", s);
    router.push(`/admin/students/attendance?${params.toString()}`);
  }

  function markAllPresent() {
    const map: Record<string, AttendanceStatus> = {};
    for (const row of initialRows) map[row.studentId] = "PRESENT";
    setMarks(map);
  }

  async function onSave() {
    if (!classId) {
      setError("Select a class first.");
      return;
    }
    if (!initialRows.length) {
      setError("No students in this class/section.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    const result = await saveAttendanceAction({
      date,
      classId,
      marks: initialRows.map((row) => ({
        studentId: row.studentId,
        sectionId: row.sectionId,
        status: marks[row.studentId] ?? "PRESENT",
      })),
    });

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage(`Saved attendance for ${result.saved} students.`);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="display-font text-3xl">Attendance</h2>
        <p className="mt-1 text-sm text-muted">
          Mark daily attendance by class and section (admin). Teachers can use
          this later.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-4">
        <div>
          <Label htmlFor="attendanceDate">Date</Label>
          <Input
            id="attendanceDate"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              loadSheet({ date: e.target.value });
            }}
          />
        </div>
        <div>
          <Label htmlFor="attendanceClass">Class</Label>
          <select
            id="attendanceClass"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId("");
              loadSheet({ classId: e.target.value, sectionId: "" });
            }}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="">Select class</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="attendanceSection">Section</Label>
          <select
            id="attendanceSection"
            value={sectionId}
            onChange={(e) => {
              setSectionId(e.target.value);
              loadSheet({ sectionId: e.target.value });
            }}
            disabled={!classId}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="">All sections</option>
            {sections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={markAllPresent}
            disabled={!initialRows.length}
          >
            Mark all present
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={loading || !classId || !initialRows.length}
          >
            {loading ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {lastMarkedByName ? (
        <p className="text-sm text-muted">
          Previously marked by {lastMarkedByName} for this sheet.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <SortableTh columnKey="roll" label="Roll" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
              <SortableTh columnKey="name" label="Name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
              <SortableTh columnKey="reg" label="Reg. ID" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
              <SortableTh columnKey="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {!classId ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  Select a class to load the attendance sheet.
                </td>
              </tr>
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  No active students in this class/section.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr
                  key={row.studentId}
                  className="border-t border-border hover:bg-background/70"
                >
                  <td className="px-3 py-3 tabular-nums text-muted">
                    {row.rollNumber || "—"}
                  </td>
                  <td className="px-3 py-3 font-medium">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-muted">
                    {row.admissionNumber}
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={marks[row.studentId] ?? "PRESENT"}
                      onChange={(e) =>
                        setMarks((prev) => ({
                          ...prev,
                          [row.studentId]: e.target.value as AttendanceStatus,
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

      {message ? <p className="text-sm text-brand">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
