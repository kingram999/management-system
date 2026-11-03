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
import type { ExamTermRecord } from "@/lib/data/exams";
import type { MarksSheetRow } from "@/lib/data/marks";
import { roundToHalf } from "@/lib/marks-utils";
import type { SubjectRecord } from "@/lib/data/subjects";
import { saveMarksAction } from "./actions";

type MarksSortKey = "roll" | "student" | "marks" | "absent";

type ClassOption = {
  id: string;
  name: string;
  sections: Array<{ id: string; name: string }>;
};

type RowState = {
  marksObtained: string;
  isAbsent: boolean;
};

export function MarksClient({
  terms,
  subjects,
  classes,
  initialTermId,
  initialClassId,
  initialSectionId,
  initialSubjectId,
  sheet,
}: {
  terms: ExamTermRecord[];
  subjects: SubjectRecord[];
  classes: ClassOption[];
  initialTermId: string;
  initialClassId: string;
  initialSectionId: string;
  initialSubjectId: string;
  sheet: {
    examSubjectId: string;
    maxMarks: number;
    passMarks: number;
    isLocked: boolean;
    subjectName: string;
    rows: MarksSheetRow[];
  } | null;
}) {
  const router = useRouter();
  const [termId, setTermId] = useState(initialTermId);
  const [classId, setClassId] = useState(initialClassId);
  const [sectionId, setSectionId] = useState(initialSectionId);
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    toState(sheet?.rows ?? []),
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sections = useMemo(
    () => classes.find((item) => item.id === classId)?.sections ?? [],
    [classes, classId],
  );
  const { sortKey, sortDir, toggleSort } =
    useSortableState<MarksSortKey>("roll");
  const sortedSheetRows = useMemo(() => {
    const list = sheet?.rows ?? [];
    return sortRows(list, sortKey, sortDir, (row, key) => {
      const state = rows[row.studentId];
      switch (key) {
        case "roll":
          return row.rollNumber;
        case "student":
          return `${row.firstName} ${row.lastName}`;
        case "marks":
          return state?.isAbsent
            ? -1
            : Number(state?.marksObtained || row.marksObtained || 0);
        case "absent":
          return state?.isAbsent ? 1 : 0;
      }
    });
  }, [sheet?.rows, sortKey, sortDir, rows]);

  useEffect(() => {
    setRows(toState(sheet?.rows ?? []));
  }, [sheet]);

  function loadSheet(next: {
    termId?: string;
    classId?: string;
    sectionId?: string;
    subjectId?: string;
  }) {
    const params = new URLSearchParams();
    const t = next.termId ?? termId;
    const c = next.classId ?? classId;
    const s = next.sectionId ?? sectionId;
    const sub = next.subjectId ?? subjectId;
    if (t) params.set("termId", t);
    if (c) params.set("classId", c);
    if (s) params.set("sectionId", s);
    if (sub) params.set("subjectId", sub);
    router.push(`/admin/marks?${params.toString()}`);
  }

  async function onSave() {
    if (!sheet) {
      setError("Select exam, class, and subject first. Attach the subject on the Exams page if missing.");
      return;
    }
    if (sheet.isLocked) {
      setError("This exam is locked.");
      return;
    }
    if (!sheet.rows.length) {
      setError("No students in this class/section.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const marks = sheet.rows.map((row) => {
        const state = rows[row.studentId];
        if (state?.isAbsent) {
          return {
            studentId: row.studentId,
            sectionId: row.sectionId,
            marksObtained: null,
            isAbsent: true,
          };
        }
        const value = Number(state?.marksObtained);
        if (state?.marksObtained === "" || Number.isNaN(value)) {
          throw new Error(
            `Enter marks for ${row.firstName} ${row.lastName} or mark absent.`,
          );
        }
        const rounded = roundToHalf(value);
        return {
          studentId: row.studentId,
          sectionId: row.sectionId,
          marksObtained: rounded,
          isAbsent: false,
        };
      });

      const result = await saveMarksAction({
        examSubjectId: sheet.examSubjectId,
        marks,
      });

      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(`Saved marks for ${result.saved} students.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save marks.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="display-font text-3xl">Marks entry</h2>
        <p className="mt-1 text-sm text-muted">
          Enter scores by exam, class, section, and subject
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-4">
        <div>
          <Label htmlFor="termId">Exam</Label>
          <select
            id="termId"
            value={termId}
            onChange={(e) => {
              const nextTermId = e.target.value;
              const term = terms.find((t) => t.id === nextTermId);
              const nextClassId = term?.class_id || "";
              const nextSectionId = term?.section_id || "";
              setTermId(nextTermId);
              setClassId(nextClassId);
              setSectionId(nextSectionId);
              loadSheet({
                termId: nextTermId,
                classId: nextClassId,
                sectionId: nextSectionId,
              });
            }}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="">Select…</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
                {term.class_name
                  ? ` · ${term.class_name}${term.section_name ? `-${term.section_name}` : ""}`
                  : ""}
                {term.is_locked ? " (locked)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="classId">Class</Label>
          <select
            id="classId"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId("");
              loadSheet({ classId: e.target.value, sectionId: "" });
            }}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="">Select…</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="sectionId">Section</Label>
          <select
            id="sectionId"
            value={sectionId}
            onChange={(e) => {
              setSectionId(e.target.value);
              loadSheet({ sectionId: e.target.value });
            }}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="">All</option>
            {sections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="subjectId">Subject</Label>
          <select
            id="subjectId"
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              loadSheet({ subjectId: e.target.value });
            }}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="">Select…</option>
            {subjects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {termId && classId && subjectId && !sheet ? (
        <p className="text-sm text-muted">
          This subject is not attached to the selected exam/class. Attach it under{" "}
          <a href="/admin/exams" className="text-brand">
            Exams
          </a>
          .
        </p>
      ) : null}

      {sheet ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {sheet.subjectName} · Max {sheet.maxMarks} · Pass {sheet.passMarks}
            {sheet.isLocked ? " · Locked" : ""}
          </p>
          <Button
            type="button"
            onClick={onSave}
            disabled={loading || sheet.isLocked || !sheet.rows.length}
          >
            {loading ? "Saving…" : "Save marks"}
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-brand">{message}</p> : null}

      {sheet ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-background text-muted">
              <tr>
                <SortableTh columnKey="roll" label="Roll" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh columnKey="student" label="Student" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh columnKey="marks" label="Marks" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh columnKey="absent" label="Absent" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {sortedSheetRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    No active students in this class/section.
                  </td>
                </tr>
              ) : (
                sortedSheetRows.map((row) => {
                  const state = rows[row.studentId] ?? {
                    marksObtained: "",
                    isAbsent: false,
                  };
                  return (
                    <tr key={row.studentId} className="border-t border-border">
                      <td className="px-4 py-3 tabular-nums">
                        {row.rollNumber || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {row.firstName} {row.lastName}
                        </p>
                        <p className="text-xs text-muted">
                          {row.admissionNumber}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min={0}
                          max={sheet.maxMarks}
                          step="0.5"
                          disabled={state.isAbsent || sheet.isLocked}
                          value={state.isAbsent ? "" : state.marksObtained}
                          onChange={(e) =>
                            setRows((prev) => ({
                              ...prev,
                              [row.studentId]: {
                                ...state,
                                marksObtained: e.target.value,
                                isAbsent: false,
                              },
                            }))
                          }
                          onBlur={(e) => {
                            const raw = e.target.value.trim();
                            if (raw === "") return;
                            const value = Number(raw);
                            if (Number.isNaN(value)) return;
                            setRows((prev) => ({
                              ...prev,
                              [row.studentId]: {
                                ...state,
                                marksObtained: String(roundToHalf(value)),
                                isAbsent: false,
                              },
                            }));
                          }}
                          className="w-28"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={state.isAbsent}
                          disabled={sheet.isLocked}
                          onChange={(e) =>
                            setRows((prev) => ({
                              ...prev,
                              [row.studentId]: {
                                marksObtained: "",
                                isAbsent: e.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function toState(rows: MarksSheetRow[]) {
  const map: Record<string, RowState> = {};
  for (const row of rows) {
    map[row.studentId] = {
      marksObtained:
        row.marksObtained == null || row.isAbsent
          ? ""
          : String(row.marksObtained),
      isAbsent: row.isAbsent,
    };
  }
  return map;
}
