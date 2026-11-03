"use client";

import { useCallback, useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export function useSortableState<K extends string>(defaultKey: K) {
  const [sortKey, setSortKey] = useState<K>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = useCallback((key: K) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }, [sortKey]);

  return { sortKey, sortDir, toggleSort, setSortKey, setSortDir };
}

export function compareSortValues(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
  dir: SortDir,
): number {
  const emptyA = a == null || a === "";
  const emptyB = b == null || b === "";
  if (emptyA && emptyB) return 0;
  if (emptyA) return 1;
  if (emptyB) return -1;

  let cmp = 0;
  if (typeof a === "number" && typeof b === "number") {
    cmp = a - b;
  } else {
    cmp = String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }
  return dir === "asc" ? cmp : -cmp;
}

export function sortRows<T, K extends string>(
  rows: T[],
  sortKey: K,
  sortDir: SortDir,
  getValue: (row: T, key: K) => string | number | null | undefined,
): T[] {
  return [...rows].sort((a, b) =>
    compareSortValues(getValue(a, sortKey), getValue(b, sortKey), sortDir),
  );
}

export function useSortedRows<T, K extends string>(
  rows: T[],
  defaultKey: K,
  getValue: (row: T, key: K) => string | number | null | undefined,
) {
  const { sortKey, sortDir, toggleSort } = useSortableState(defaultKey);
  const sorted = useMemo(
    () => sortRows(rows, sortKey, sortDir, getValue),
    [rows, sortKey, sortDir, getValue],
  );
  return { sorted, sortKey, sortDir, toggleSort };
}

export function SortableTh<K extends string>({
  columnKey,
  label,
  sortKey,
  sortDir,
  onSort,
  className = "px-4 py-3 font-medium",
}: {
  columnKey: K;
  label: string;
  sortKey: K;
  sortDir: SortDir;
  onSort: (key: K) => void;
  className?: string;
}) {
  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className="inline-flex items-center gap-1 whitespace-nowrap"
      >
        <span className="whitespace-nowrap">{label}</span>
        {sortKey === columnKey ? (
          <span className="shrink-0" aria-hidden>
            {sortDir === "asc" ? "↑" : "↓"}
          </span>
        ) : null}
      </button>
    </th>
  );
}
