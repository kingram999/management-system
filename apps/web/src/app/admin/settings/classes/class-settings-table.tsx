"use client";

import { Check, Pencil, Plus, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  SortableTh,
  sortRows,
  useSortableState,
} from "@/components/sortable-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLASS_LEVELS, formatInr } from "@/lib/class-levels";
import type { SectionRow } from "@/lib/data/types";
import {
  createClass,
  deleteSectionAction,
  updateSectionRowAction,
} from "../actions";

type ClassSortKey = "class" | "section" | "teacher" | "fee";

type Draft = {
  className: string;
  sectionName: string;
  headTeacherName: string;
  annualFee: string;
};

export function ClassSettingsTable({
  rows,
  academicYearId,
  yearName,
}: {
  rows: SectionRow[];
  academicYearId: string;
  yearName: string;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const dialogTitleId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const { sortKey, sortDir, toggleSort } =
    useSortableState<ClassSortKey>("class");
  const sortedRows = useMemo(
    () =>
      sortRows(rows, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "class":
            return row.className;
          case "section":
            return row.sectionName;
          case "teacher":
            return row.headTeacherName;
          case "fee":
            return row.annualFee;
        }
      }),
    [rows, sortKey, sortDir],
  );

  useEffect(() => {
    if (showCreate) {
      firstFieldRef.current?.focus();
    }
  }, [showCreate]);

  useEffect(() => {
    if (!showCreate) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setShowCreate(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showCreate]);

  async function run(
    action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>,
    formData: FormData,
    successMessage: string,
  ) {
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      const result = await action(formData);
      if (result.error) {
        setError(result.error);
        return false;
      }
      setMessage(successMessage);
      setShowCreate(false);
      setEditingId(null);
      setDraft(null);
      return true;
    } finally {
      setPending(false);
    }
  }

  function startEdit(row: SectionRow) {
    setError(null);
    setMessage(null);
    setEditingId(row.sectionId);
    setDraft({
      className: row.className,
      sectionName: row.sectionName,
      headTeacherName: row.headTeacherName ?? "",
      annualFee: String(row.annualFee),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit(row: SectionRow) {
    if (!draft) return;

    const feeValue = Number(draft.annualFee);
    const unchanged =
      draft.className.trim() === row.className &&
      draft.sectionName.trim() === row.sectionName &&
      (draft.headTeacherName.trim() || null) === (row.headTeacherName ?? null) &&
      feeValue === row.annualFee;

    if (unchanged) {
      cancelEdit();
      return;
    }

    const formData = new FormData();
    formData.set("sectionId", row.sectionId);
    formData.set("classId", row.classId);
    formData.set("className", draft.className);
    formData.set("sectionName", draft.sectionName);
    formData.set("headTeacherName", draft.headTeacherName);
    formData.set("annualFee", draft.annualFee);
    await run(updateSectionRowAction, formData, "Saved.");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="display-font text-3xl">Class settings</h2>
          <p className="mt-1 text-sm text-muted">
            Classes and sections for {yearName}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="flex items-center justify-between border-b border-border bg-background px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Add class or section"
            onClick={() => {
              cancelEdit();
              setShowCreate(true);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted tabular-nums">
            {rows.length} sections
          </span>
        </div>

        <table className="min-w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">S.No</th>
              <SortableTh columnKey="class" label="Class" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="section" label="Section" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="teacher" label="Head Teacher" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="fee" label="Fee" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No sections yet. Use + to add one.
                </td>
              </tr>
            ) : (
              sortedRows.map((row, index) => {
                const isEditing = editingId === row.sectionId;
                return (
                  <tr key={row.sectionId} className="border-t border-border">
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing && draft ? (
                        <Input
                          value={draft.className}
                          onChange={(e) =>
                            setDraft({ ...draft, className: e.target.value })
                          }
                          aria-label="Class name"
                          className="max-w-[180px]"
                        />
                      ) : (
                        <span className="font-medium text-foreground">
                          {row.className}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing && draft ? (
                        <Input
                          value={draft.sectionName}
                          onChange={(e) =>
                            setDraft({ ...draft, sectionName: e.target.value })
                          }
                          aria-label="Section name"
                          className="max-w-[120px]"
                        />
                      ) : (
                        <span className="text-muted">{row.sectionName}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing && draft ? (
                        <Input
                          value={draft.headTeacherName}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              headTeacherName: e.target.value,
                            })
                          }
                          aria-label="Head teacher"
                          placeholder="Optional"
                          className="max-w-[200px]"
                        />
                      ) : (
                        <span className="text-muted">
                          {row.headTeacherName || "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing && draft ? (
                        <Input
                          type="number"
                          min={0}
                          step={500}
                          value={draft.annualFee}
                          onChange={(e) =>
                            setDraft({ ...draft, annualFee: e.target.value })
                          }
                          aria-label="Annual fee"
                          className="max-w-[140px]"
                        />
                      ) : (
                        <span className="tabular-nums text-muted">
                          {formatInr(row.annualFee)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {isEditing ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Save changes"
                            disabled={pending}
                            onClick={() => void saveEdit(row)}
                          >
                            <Check className="h-4 w-4 text-success" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${row.className} ${row.sectionName}`}
                            disabled={pending || editingId !== null}
                            onClick={() => startEdit(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${row.className} ${row.sectionName}`}
                          disabled={pending}
                          onClick={async () => {
                            if (
                              !confirm(
                                `Delete section ${row.className}-${row.sectionName}? Soft-deleted for 14 days.`,
                              )
                            ) {
                              return;
                            }
                            const formData = new FormData();
                            formData.set("sectionId", row.sectionId);
                            await run(
                              deleteSectionAction,
                              formData,
                              "Section deleted.",
                            );
                          }}
                        >
                          <X className="h-4 w-4 text-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showCreate ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => setShowCreate(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id={dialogTitleId} className="font-semibold text-foreground">
                  Add class / section
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Reuse an existing class name to add another section. Fee is
                  set from level for new classes.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close"
                onClick={() => setShowCreate(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form
              className="mt-4 grid gap-3"
              action={async (formData) => {
                formData.set("academicYearId", academicYearId);
                await run(createClass, formData, "Created.");
              }}
            >
              <div>
                <Label htmlFor="new-class-name">Class name</Label>
                <Input
                  ref={firstFieldRef}
                  id="new-class-name"
                  name="className"
                  required
                  placeholder="Class 1"
                  list="class-level-names"
                />
                <datalist id="class-level-names">
                  {CLASS_LEVELS.map((level) => (
                    <option key={level.numericLevel} value={level.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label htmlFor="new-level">Level</Label>
                <select
                  id="new-level"
                  name="numericLevel"
                  required
                  defaultValue=""
                  className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-brand"
                >
                  <option value="" disabled>
                    Select level
                  </option>
                  {CLASS_LEVELS.map((level) => (
                    <option
                      key={level.numericLevel}
                      value={level.numericLevel}
                    >
                      {level.name} ({level.numericLevel})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="new-section-name">Section</Label>
                <Input
                  id="new-section-name"
                  name="sectionName"
                  required
                  placeholder="A"
                />
              </div>
              <div>
                <Label htmlFor="new-head-teacher">Head Teacher</Label>
                <Input
                  id="new-head-teacher"
                  name="headTeacherName"
                  placeholder="Optional"
                />
              </div>
              <div className="mt-1 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
