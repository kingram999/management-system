"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  SortableTh,
  sortRows,
  useSortableState,
} from "@/components/sortable-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StudentDirectoryRow } from "@/lib/data/students";

type AssignSortKey = "name" | "class" | "section" | "roll";

export type AssignClassOption = {
  id: string;
  name: string;
  sections: Array<{ id: string; name: string }>;
};

export function useAssignFilters(
  students: StudentDirectoryRow[],
  classes: AssignClassOption[],
) {
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [status, setStatus] = useState("");
  const [gender, setGender] = useState("");
  const [house, setHouse] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const sections = useMemo(() => {
    const selectedClass = classes.find((item) => item.id === classId);
    return selectedClass?.sections ?? [];
  }, [classes, classId]);

  const houses = useMemo(() => {
    return Array.from(
      new Set(students.map((s) => s.house).filter(Boolean) as string[]),
    ).sort();
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((student) => {
      if (classId && student.class_id !== classId) return false;
      if (sectionId && student.section_id !== sectionId) return false;
      if (status && student.status !== status) return false;
      if (gender && student.gender !== gender) return false;
      if (house && student.house !== house) return false;
      if (!q) return true;
      const haystack = [
        student.first_name,
        student.last_name,
        `${student.first_name} ${student.last_name}`,
        student.admission_number,
        student.roll_number,
        student.class_name,
        student.section_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [students, search, classId, sectionId, status, gender, house]);

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function toggleSelectAllFiltered() {
    const ids = filtered.map((row) => row.id);
    const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id));
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...ids])));
    }
  }

  return {
    search,
    setSearch,
    classId,
    setClassId,
    sectionId,
    setSectionId,
    status,
    setStatus,
    gender,
    setGender,
    house,
    setHouse,
    selected,
    setSelected,
    sections,
    houses,
    filtered,
    toggleSelect,
    toggleSelectAllFiltered,
  };
}

export function AssignFiltersBar({
  classes,
  state,
  requireClass,
}: {
  classes: AssignClassOption[];
  state: ReturnType<typeof useAssignFilters>;
  requireClass?: boolean;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-3 lg:grid-cols-6">
      <Input
        placeholder="Search name, ID, roll…"
        value={state.search}
        onChange={(e) => state.setSearch(e.target.value)}
        className="md:col-span-2 lg:col-span-2"
      />
      <select
        value={state.classId}
        onChange={(e) => {
          state.setClassId(e.target.value);
          state.setSectionId("");
        }}
        className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
      >
        <option value="">
          {requireClass ? "Select class (required)" : "All classes"}
        </option>
        {classes.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <select
        value={state.sectionId}
        onChange={(e) => state.setSectionId(e.target.value)}
        className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        disabled={!state.classId}
      >
        <option value="">All sections</option>
        {state.sections.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <select
        value={state.status}
        onChange={(e) => state.setStatus(e.target.value)}
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
        value={state.gender}
        onChange={(e) => state.setGender(e.target.value)}
        className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
      >
        <option value="">All genders</option>
        <option value="MALE">Male</option>
        <option value="FEMALE">Female</option>
        <option value="OTHER">Other</option>
      </select>
      <select
        value={state.house}
        onChange={(e) => state.setHouse(e.target.value)}
        className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
      >
        <option value="">All houses</option>
        {state.houses.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AssignRuleBanner({
  label,
  ruleLabel,
}: {
  label: string;
  ruleLabel: string;
}) {
  return (
    <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted">
      {label}: <span className="font-medium text-foreground">{ruleLabel}</span>
      {" · "}
      <Link href="/admin/settings/assignment" className="text-brand underline">
        Assignment settings
      </Link>
    </p>
  );
}

export function AssignStudentsTable({
  filtered,
  selected,
  toggleSelect,
  toggleSelectAllFiltered,
  toolbar,
}: {
  filtered: StudentDirectoryRow[];
  selected: string[];
  toggleSelect: (id: string) => void;
  toggleSelectAllFiltered: () => void;
  toolbar?: ReactNode;
}) {
  const allSelected =
    filtered.length > 0 && filtered.every((row) => selected.includes(row.id));
  const { sortKey, sortDir, toggleSort } =
    useSortableState<AssignSortKey>("name");
  const sorted = useMemo(
    () =>
      sortRows(filtered, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "name":
            return `${row.first_name} ${row.last_name}`;
          case "class":
            return row.class_name;
          case "section":
            return row.section_name;
          case "roll":
            return row.roll_number;
        }
      }),
    [filtered, sortKey, sortDir],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted tabular-nums">
          {filtered.length} students · {selected.length} selected
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={toggleSelectAllFiltered}
          disabled={filtered.length === 0}
        >
          {allSelected ? "Clear filtered" : "Select filtered"}
        </Button>
        {toolbar}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAllFiltered}
                  aria-label="Select filtered"
                />
              </th>
              <SortableTh columnKey="name" label="Name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
              <SortableTh columnKey="class" label="Class" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
              <SortableTh columnKey="section" label="Section" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
              <SortableTh columnKey="roll" label="Roll number" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No students match your filters.
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
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
                  <td className="px-3 py-3 font-medium">
                    {row.first_name} {row.last_name}
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {row.class_name || "—"}
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {row.section_name || "—"}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-muted">
                    {row.roll_number || "—"}
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
