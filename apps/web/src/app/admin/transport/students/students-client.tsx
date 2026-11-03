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
import type {
  TransportMode,
  TransportRouteRecord,
  TransportStopRecord,
  TransportStudentRow,
} from "@/lib/data/transport";
import {
  clearStudentTransportAction,
  upsertStudentTransportAction,
} from "../actions";

type SortKey =
  | "name"
  | "admission"
  | "class"
  | "route"
  | "stop"
  | "mode";

const MODE_LABEL: Record<TransportMode, string> = {
  BOTH: "Pickup & drop",
  PICKUP: "Pickup only",
  DROP: "Drop only",
};

export function TransportStudentsClient({
  students,
  routes,
  stops,
  classes,
}: {
  students: TransportStudentRow[];
  routes: TransportRouteRecord[];
  stops: TransportStopRecord[];
  classes: Array<{
    id: string;
    name: string;
    sections: Array<{ id: string; name: string }>;
  }>;
}) {
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [usesFilter, setUsesFilter] = useState<"all" | "yes" | "no">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRouteId, setEditRouteId] = useState("");
  const [editStopId, setEditStopId] = useState("");
  const [editMode, setEditMode] = useState<TransportMode>("BOTH");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const { sortKey, sortDir, toggleSort } = useSortableState<SortKey>("name");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((row) => {
      if (classId && row.class_id !== classId) return false;
      if (routeFilter && row.assignment?.route_id !== routeFilter) return false;
      if (usesFilter === "yes" && !row.assignment) return false;
      if (usesFilter === "no" && row.assignment) return false;
      if (!q) return true;
      const haystack = [
        row.first_name,
        row.last_name,
        `${row.first_name} ${row.last_name}`,
        row.admission_number,
        row.class_name,
        row.assignment?.route_name,
        row.assignment?.stop_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [students, search, classId, routeFilter, usesFilter]);

  const sorted = useMemo(
    () =>
      sortRows(filtered, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "name":
            return `${row.last_name} ${row.first_name}`;
          case "admission":
            return row.admission_number;
          case "class":
            return [row.class_name, row.section_name].filter(Boolean).join("-");
          case "route":
            return row.assignment?.route_name;
          case "stop":
            return row.assignment?.stop_name;
          case "mode":
            return row.assignment?.mode;
        }
      }),
    [filtered, sortKey, sortDir],
  );

  const editStops = useMemo(
    () => stops.filter((s) => s.route_id === editRouteId),
    [stops, editRouteId],
  );

  function startEdit(row: TransportStudentRow) {
    setEditingId(row.student_id);
    setEditRouteId(row.assignment?.route_id ?? routes[0]?.id ?? "");
    setEditStopId(row.assignment?.stop_id ?? "");
    setEditMode(row.assignment?.mode ?? "BOTH");
    setError(null);
    setMessage(null);
  }

  async function saveAssignment(studentId: string) {
    if (!editRouteId || !editStopId) {
      setError("Select a route and stop.");
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    const formData = new FormData();
    formData.set("studentId", studentId);
    formData.set("routeId", editRouteId);
    formData.set("stopId", editStopId);
    formData.set("mode", editMode);
    const result = await upsertStudentTransportAction(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage("Transport assignment saved.");
    setEditingId(null);
  }

  async function clearAssignment(studentId: string) {
    if (!window.confirm("Clear transport assignment for this student?")) {
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    const formData = new FormData();
    formData.set("studentId", studentId);
    const result = await clearStudentTransportAction(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage("Transport assignment cleared.");
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="display-font text-3xl">Transport students</h2>
        <p className="mt-1 text-sm text-muted">
          Assign students to a route and stop
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Search name, ID, route…"
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
          value={routeFilter}
          onChange={(e) => setRouteFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">All routes</option>
          {routes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={usesFilter}
          onChange={(e) =>
            setUsesFilter(e.target.value as "all" | "yes" | "no")
          }
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="all">All students</option>
          <option value="yes">Uses transport</option>
          <option value="no">No transport</option>
        </select>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      <p className="text-sm text-muted tabular-nums">
        {sorted.length} students
      </p>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <SortableTh
                columnKey="name"
                label="Student"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                columnKey="admission"
                label="Reg. ID"
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
                columnKey="route"
                label="Route"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                columnKey="stop"
                label="Stop"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                columnKey="mode"
                label="Mode"
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
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No students match these filters.
                </td>
              </tr>
            ) : (
              sorted.map((row) =>
                editingId === row.student_id ? (
                  <tr key={row.student_id} className="border-t border-border">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="flex flex-wrap items-end gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            {row.first_name} {row.last_name}
                          </p>
                          <p className="text-xs text-muted">
                            {row.admission_number}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor={`route-${row.student_id}`}>
                            Route
                          </Label>
                          <select
                            id={`route-${row.student_id}`}
                            value={editRouteId}
                            onChange={(e) => {
                              setEditRouteId(e.target.value);
                              setEditStopId("");
                            }}
                            className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
                          >
                            <option value="">Select route</option>
                            {routes.map((route) => (
                              <option key={route.id} value={route.id}>
                                {route.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor={`stop-${row.student_id}`}>
                            Stop
                          </Label>
                          <select
                            id={`stop-${row.student_id}`}
                            value={editStopId}
                            onChange={(e) => setEditStopId(e.target.value)}
                            className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
                            disabled={!editRouteId}
                          >
                            <option value="">Select stop</option>
                            {editStops.map((stop) => (
                              <option key={stop.id} value={stop.id}>
                                {stop.sequence}. {stop.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor={`mode-${row.student_id}`}>Mode</Label>
                          <select
                            id={`mode-${row.student_id}`}
                            value={editMode}
                            onChange={(e) =>
                              setEditMode(e.target.value as TransportMode)
                            }
                            className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
                          >
                            <option value="BOTH">Pickup & drop</option>
                            <option value="PICKUP">Pickup only</option>
                            <option value="DROP">Drop only</option>
                          </select>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          disabled={pending}
                          onClick={() => saveAssignment(row.student_id)}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        {row.assignment ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            disabled={pending}
                            onClick={() => clearAssignment(row.student_id)}
                          >
                            Clear
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={row.student_id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">
                      {row.first_name} {row.last_name}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.admission_number}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {[row.class_name, row.section_name]
                        .filter(Boolean)
                        .join("-") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {row.assignment?.route_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {row.assignment?.stop_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {row.assignment
                        ? MODE_LABEL[row.assignment.mode]
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => startEdit(row)}
                      >
                        {row.assignment ? "Edit" : "Assign"}
                      </Button>
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
