"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StudentDirectoryRow } from "@/lib/data/students";

type ClassOption = {
  id: string;
  name: string;
  sections: Array<{ id: string; name: string }>;
};

type ColumnKey =
  | "admission_number"
  | "name"
  | "date_of_birth"
  | "gender"
  | "blood_group"
  | "address"
  | "city"
  | "state"
  | "pincode"
  | "nationality"
  | "mother_tongue"
  | "id_number"
  | "house"
  | "category"
  | "remarks"
  | "status"
  | "photo_url"
  | "admitted_at"
  | "class_name"
  | "section_name"
  | "roll_number"
  | "guardian_name"
  | "guardian_phone"
  | "father_name"
  | "mother_name"
  | "default_fee"
  | "concession_amount"
  | "final_fee"
  | "paid_fee"
  | "pending_fee"
  | "uses_transport"
  | "transport_route"
  | "transport_stop"
  | "transport_mode";

type SortKey = ColumnKey;

const FEE_COLUMNS = new Set<ColumnKey>([
  "default_fee",
  "concession_amount",
  "final_fee",
  "paid_fee",
  "pending_fee",
]);

const ALL_COLUMNS: Array<{ key: ColumnKey; label: string }> = [
  { key: "admission_number", label: "Reg. ID" },
  { key: "name", label: "Name" },
  { key: "class_name", label: "Class" },
  { key: "section_name", label: "Section" },
  { key: "roll_number", label: "Roll" },
  { key: "father_name", label: "Father" },
  { key: "mother_name", label: "Mother" },
  { key: "guardian_name", label: "Guardian" },
  { key: "guardian_phone", label: "Phone" },
  { key: "status", label: "Status" },
  { key: "gender", label: "Gender" },
  { key: "date_of_birth", label: "Date of birth" },
  { key: "blood_group", label: "Blood group" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "pincode", label: "Pincode" },
  { key: "nationality", label: "Nationality" },
  { key: "mother_tongue", label: "Language" },
  { key: "id_number", label: "ID number" },
  { key: "house", label: "House" },
  { key: "category", label: "Category" },
  { key: "remarks", label: "Remarks" },
  { key: "photo_url", label: "Photo" },
  { key: "admitted_at", label: "Admitted at" },
  { key: "default_fee", label: "Default fee" },
  { key: "concession_amount", label: "Concession amount" },
  { key: "final_fee", label: "Final fee" },
  { key: "paid_fee", label: "Paid fee" },
  { key: "pending_fee", label: "Pending fee" },
  { key: "uses_transport", label: "Transport" },
  { key: "transport_route", label: "Route" },
  { key: "transport_stop", label: "Stop" },
  { key: "transport_mode", label: "Transport mode" },
];

const DEFAULT_COLUMNS: ColumnKey[] = [
  "admission_number",
  "name",
  "class_name",
  "section_name",
  "roll_number",
  "father_name",
  "mother_name",
  "guardian_name",
  "guardian_phone",
  "status",
  "gender",
  "house",
  "transport_route",
];

const PAGE_SIZE = 20;

function formatFee(value: number | null): string {
  if (value == null) return "";
  return `₹${value.toLocaleString("en-IN")}`;
}

function feeNumber(
  row: StudentDirectoryRow,
  key: ColumnKey,
): number | null {
  switch (key) {
    case "default_fee":
      return row.default_fee;
    case "concession_amount":
      return row.concession_amount;
    case "final_fee":
      return row.final_fee;
    case "paid_fee":
      return row.paid_fee;
    case "pending_fee":
      return row.pending_fee;
    default:
      return null;
  }
}

function cellValue(row: StudentDirectoryRow, key: ColumnKey): string {
  switch (key) {
    case "name":
      return `${row.first_name} ${row.last_name}`;
    case "photo_url":
      return row.photo_url ? "Yes" : "No";
    case "status":
      return row.status.replaceAll("_", " ");
    case "category":
      return row.category
        ? row.category.replaceAll("_", " ")
        : "";
    case "uses_transport":
      return row.uses_transport ? "Yes" : "No";
    case "transport_mode":
      if (!row.transport_mode) return "";
      if (row.transport_mode === "BOTH") return "Pickup & drop";
      if (row.transport_mode === "PICKUP") return "Pickup";
      if (row.transport_mode === "DROP") return "Drop";
      return row.transport_mode;
    case "default_fee":
    case "concession_amount":
    case "final_fee":
    case "paid_fee":
    case "pending_fee":
      return formatFee(feeNumber(row, key));
    default: {
      const value = row[key as keyof StudentDirectoryRow];
      return value == null || value === "" ? "" : String(value);
    }
  }
}

export function StudentDirectory({
  students,
  classes,
}: {
  students: StudentDirectoryRow[];
  classes: ClassOption[];
}) {
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [status, setStatus] = useState("");
  const [gender, setGender] = useState("");
  const [house, setHouse] = useState("");
  const [routeId, setRouteId] = useState("");
  const [usesTransport, setUsesTransport] = useState<"all" | "yes" | "no">(
    "all",
  );
  const [view, setView] = useState<"list" | "cards">("list");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] =
    useState<ColumnKey[]>(DEFAULT_COLUMNS);
  const [showColumns, setShowColumns] = useState(false);
  const [page, setPage] = useState(1);
  const [scrollWidth, setScrollWidth] = useState(0);

  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const syncingScroll = useRef(false);

  const sections = useMemo(() => {
    const selectedClass = classes.find((item) => item.id === classId);
    return selectedClass?.sections ?? [];
  }, [classes, classId]);

  const houses = useMemo(() => {
    return Array.from(
      new Set(students.map((s) => s.house).filter(Boolean) as string[]),
    ).sort();
  }, [students]);

  const routes = useMemo(() => {
    const map = new Map<string, string>();
    for (const student of students) {
      if (student.transport_route_id && student.transport_route) {
        map.set(student.transport_route_id, student.transport_route);
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = students.filter((student) => {
      if (classId && student.class_id !== classId) return false;
      if (sectionId && student.section_id !== sectionId) return false;
      if (status && student.status !== status) return false;
      if (gender && student.gender !== gender) return false;
      if (house && student.house !== house) return false;
      if (routeId && student.transport_route_id !== routeId) return false;
      if (usesTransport === "yes" && !student.uses_transport) return false;
      if (usesTransport === "no" && student.uses_transport) return false;
      if (!q) return true;
      const haystack = [
        student.first_name,
        student.last_name,
        `${student.first_name} ${student.last_name}`,
        student.admission_number,
        student.roll_number,
        student.guardian_name,
        student.guardian_phone,
        student.father_name,
        student.mother_name,
        student.id_number,
        student.city,
        student.transport_route,
        student.transport_stop,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    rows = [...rows].sort((a, b) => {
      if (FEE_COLUMNS.has(sortKey)) {
        const av = feeNumber(a, sortKey);
        const bv = feeNumber(b, sortKey);
        const an = av == null ? Number.NEGATIVE_INFINITY : av;
        const bn = bv == null ? Number.NEGATIVE_INFINITY : bv;
        const cmp = an - bn;
        return sortDir === "asc" ? cmp : -cmp;
      }
      const av = cellValue(a, sortKey);
      const bv = cellValue(b, sortKey);
      const cmp = av.localeCompare(bv, undefined, {
        sensitivity: "base",
        numeric: true,
      });
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [
    students,
    search,
    classId,
    sectionId,
    status,
    gender,
    house,
    routeId,
    usesTransport,
    sortKey,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [
    search,
    classId,
    sectionId,
    status,
    gender,
    house,
    routeId,
    usesTransport,
    sortKey,
    sortDir,
  ]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    const table = tableRef.current;
    if (!table) {
      setScrollWidth(0);
      return;
    }

    const update = () => setScrollWidth(table.scrollWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(table);
    return () => observer.disconnect();
  }, [pageRows, visibleColumns, view]);

  function syncScroll(source: "top" | "bottom") {
    if (syncingScroll.current) return;
    const from =
      source === "top" ? topScrollRef.current : bottomScrollRef.current;
    const to =
      source === "top" ? bottomScrollRef.current : topScrollRef.current;
    if (!from || !to) return;
    syncingScroll.current = true;
    to.scrollLeft = from.scrollLeft;
    requestAnimationFrame(() => {
      syncingScroll.current = false;
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function toggleSelectAllPage() {
    const ids = pageRows.map((row) => row.id);
    const allSelected = ids.every((id) => selected.includes(id));
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...ids])));
    }
  }

  function exportCsv(rows: StudentDirectoryRow[]) {
    const headers = ALL_COLUMNS.map((c) => c.label);
    const lines = rows.map((row) =>
      ALL_COLUMNS.map((column) => {
        const value = cellValue(row, column.key);
        return `"${value.replaceAll('"', '""')}"`;
      }).join(","),
    );
    const blob = new Blob([[headers.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleColumn(key: ColumnKey) {
    setVisibleColumns((prev) =>
      prev.includes(key)
        ? prev.filter((item) => item !== key)
        : [...prev, key],
    );
  }

  function SortHeader({
    columnKey,
    label,
  }: {
    columnKey: ColumnKey;
    label: string;
  }) {
    return (
      <button
        type="button"
        onClick={() => toggleSort(columnKey)}
        className="inline-flex items-center gap-1 whitespace-nowrap"
      >
        <span className="whitespace-nowrap">{label}</span>
        {sortKey === columnKey ? (
          <span className="shrink-0" aria-hidden>
            {sortDir === "asc" ? "↑" : "↓"}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="display-font text-3xl">Student directory</h2>
          <p className="mt-1 text-sm text-muted">
            Search, filter, and open student profiles
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={view === "list" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setView("list")}
          >
            List
          </Button>
          <Button
            type="button"
            variant={view === "cards" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setView("cards")}
          >
            Cards
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => exportCsv(filtered)}
          >
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-3 lg:grid-cols-4">
        <Input
          placeholder="Search name, ID, roll, guardian…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:col-span-2 lg:col-span-2"
        />
        <select
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            setSectionId("");
          }}
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
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
          disabled={!classId}
        >
          <option value="">All sections</option>
          {sections.map((item) => (
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
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="TRANSFERRED">Transferred</option>
          <option value="ALUMNI">Alumni</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">All genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
        <select
          value={house}
          onChange={(e) => setHouse(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">All houses</option>
          {houses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={routeId}
          onChange={(e) => setRouteId(e.target.value)}
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
          value={usesTransport}
          onChange={(e) =>
            setUsesTransport(e.target.value as "all" | "yes" | "no")
          }
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="all">Transport: all</option>
          <option value="yes">Uses transport</option>
          <option value="no">No transport</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted tabular-nums">
          {filtered.length} students · page {page}/{totalPages}
        </span>
        <div className="relative">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setShowColumns((v) => !v)}
          >
            Columns
          </Button>
          {showColumns ? (
            <div className="absolute left-0 z-20 mt-1 max-h-72 w-56 overflow-auto rounded-lg border border-border bg-card p-2 shadow-sm">
              {ALL_COLUMNS.map((column) => (
                <label
                  key={column.key}
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-background"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(column.key)}
                    onChange={() => toggleColumn(column.key)}
                  />
                  {column.label}
                </label>
              ))}
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={selected.length === 0}
          onClick={() =>
            exportCsv(students.filter((row) => selected.includes(row.id)))
          }
        >
          Export selected
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled title="Coming soon">
          Message
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled title="Coming soon">
          Promote
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled title="Coming soon">
          Assign section
        </Button>
      </div>

      {view === "list" ? (
        <div className="rounded-xl border border-border">
          <div
            ref={topScrollRef}
            className="overflow-x-auto border-b border-border"
            onScroll={() => syncScroll("top")}
            aria-hidden
          >
            <div style={{ width: scrollWidth || "100%", height: 1 }} />
          </div>
          <div
            ref={bottomScrollRef}
            className="overflow-x-auto"
            onScroll={() => syncScroll("bottom")}
          >
            <table ref={tableRef} className="min-w-full text-left text-sm">
              <thead className="bg-background text-muted">
                <tr>
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={
                        pageRows.length > 0 &&
                        pageRows.every((row) => selected.includes(row.id))
                      }
                      onChange={toggleSelectAllPage}
                      aria-label="Select page"
                    />
                  </th>
                  {ALL_COLUMNS.filter((c) =>
                    visibleColumns.includes(c.key),
                  ).map((column) => (
                    <th
                      key={column.key}
                      className="whitespace-nowrap px-3 py-3 font-medium"
                    >
                      <SortHeader
                        columnKey={column.key}
                        label={column.label}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.length + 1}
                      className="px-4 py-10 text-center text-muted"
                    >
                      No students match your filters.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-border hover:bg-background/70"
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          aria-label={`Select ${row.first_name}`}
                        />
                      </td>
                      {ALL_COLUMNS.filter((c) =>
                        visibleColumns.includes(c.key),
                      ).map((column) => {
                        const value = cellValue(row, column.key);
                        if (
                          column.key === "admission_number" ||
                          column.key === "name"
                        ) {
                          return (
                            <td key={column.key} className="px-3 py-3">
                              <Link
                                href={`/admin/students/${row.id}`}
                                className={
                                  column.key === "admission_number"
                                    ? "font-medium tabular-nums text-brand"
                                    : "font-medium"
                                }
                              >
                                {value || "—"}
                              </Link>
                            </td>
                          );
                        }
                        if (column.key === "photo_url") {
                          return (
                            <td key={column.key} className="px-3 py-3">
                              {row.photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={row.photo_url}
                                  alt=""
                                  className="h-8 w-8 rounded object-cover"
                                />
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                          );
                        }
                        if (FEE_COLUMNS.has(column.key)) {
                          return (
                            <td
                              key={column.key}
                              className="whitespace-nowrap px-3 py-3 tabular-nums text-muted"
                            >
                              {value || "—"}
                            </td>
                          );
                        }
                        return (
                          <td
                            key={column.key}
                            className="max-w-[180px] truncate px-3 py-3 text-muted"
                            title={value || undefined}
                          >
                            {value || "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageRows.length === 0 ? (
            <p className="col-span-full rounded-xl border border-border px-4 py-10 text-center text-sm text-muted">
              No students match your filters.
            </p>
          ) : (
            pageRows.map((row) => (
              <Link
                key={row.id}
                href={`/admin/students/${row.id}`}
                className="rounded-xl border border-border bg-background p-4 transition hover:border-brand/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-border bg-card text-lg font-semibold text-brand">
                    {row.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.photo_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      `${row.first_name.slice(0, 1)}${row.last_name.slice(0, 1)}`
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {row.first_name} {row.last_name}
                    </p>
                    <p className="text-sm text-muted">
                      {[row.class_name, row.section_name]
                        .filter(Boolean)
                        .join("-") || "No class"}
                    </p>
                    <p className="text-xs tabular-nums text-muted">
                      {row.admission_number}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <p className="text-sm text-muted tabular-nums">
          Showing {(page - 1) * PAGE_SIZE + (pageRows.length ? 1 : 0)}–
          {(page - 1) * PAGE_SIZE + pageRows.length} of {filtered.length}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
