"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SortableTh,
  sortRows,
  useSortableState,
} from "@/components/sortable-table";
import { Label } from "@/components/ui/label";
import type { ExamTermRecord } from "@/lib/data/exams";
import type { ResultStudentRow, ResultSubjectColumn } from "@/lib/data/marks";

type ClassOption = {
  id: string;
  name: string;
  sections: Array<{ id: string; name: string }>;
};

type ResultSortKey = "student" | "total" | "percentage" | "result" | string;

export function ResultsClient({
  terms,
  classes,
  initialTermId,
  initialClassId,
  initialSectionId,
  subjects,
  rows,
}: {
  terms: ExamTermRecord[];
  classes: ClassOption[];
  initialTermId: string;
  initialClassId: string;
  initialSectionId: string;
  subjects: ResultSubjectColumn[];
  rows: ResultStudentRow[];
}) {
  const router = useRouter();
  const [termId, setTermId] = useState(initialTermId);
  const [classId, setClassId] = useState(initialClassId);
  const [sectionId, setSectionId] = useState(initialSectionId);
  const { sortKey, sortDir, toggleSort } =
    useSortableState<ResultSortKey>("student");

  const sections = useMemo(
    () => classes.find((item) => item.id === classId)?.sections ?? [],
    [classes, classId],
  );

  const sortedRows = useMemo(
    () =>
      sortRows(rows, sortKey, sortDir, (row, key) => {
        if (key === "student") return `${row.firstName} ${row.lastName}`;
        if (key === "total") return row.totalObtained;
        if (key === "percentage") return row.percentage ?? -1;
        if (key === "result") {
          if (!row.complete) return "Incomplete";
          return row.passed ? "Pass" : "Fail";
        }
        if (key.startsWith("subj:")) {
          const id = key.slice(5);
          const score = row.scores[id];
          if (!score || score.isAbsent) return -1;
          return score.marksObtained ?? -1;
        }
        return null;
      }),
    [rows, sortKey, sortDir],
  );

  function load(next: {
    termId?: string;
    classId?: string;
    sectionId?: string;
  }) {
    const params = new URLSearchParams();
    const t = next.termId ?? termId;
    const c = next.classId ?? classId;
    const s = next.sectionId ?? sectionId;
    if (t) params.set("termId", t);
    if (c) params.set("classId", c);
    if (s) params.set("sectionId", s);
    router.push(`/admin/exams/results?${params.toString()}`);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="display-font text-3xl">Results</h2>
        <p className="mt-1 text-sm text-muted">
          Class-wise totals, percentage, and pass/fail for an exam term
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-3">
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
              load({
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
              load({ classId: e.target.value, sectionId: "" });
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
              load({ sectionId: e.target.value });
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
      </div>

      {!termId || !classId ? (
        <p className="text-sm text-muted">Select an exam and class to view results.</p>
      ) : subjects.length === 0 ? (
        <p className="text-sm text-muted">
          No subjects attached for this exam and class yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-background text-muted">
              <tr>
                <SortableTh
                  columnKey="student"
                  label="Student"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                  className="px-3 py-3 font-medium"
                />
                {subjects.map((subject) => (
                  <SortableTh
                    key={subject.examSubjectId}
                    columnKey={`subj:${subject.examSubjectId}`}
                    label={`${subject.subjectName} /${subject.maxMarks}`}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    className="px-3 py-3 font-medium"
                  />
                ))}
                <SortableTh
                  columnKey="total"
                  label="Total"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                  className="px-3 py-3 font-medium"
                />
                <SortableTh
                  columnKey="percentage"
                  label="%"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                  className="px-3 py-3 font-medium"
                />
                <SortableTh
                  columnKey="result"
                  label="Result"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                  className="px-3 py-3 font-medium"
                />
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={subjects.length + 4}
                    className="px-4 py-8 text-center text-muted"
                  >
                    No students in this class/section.
                  </td>
                </tr>
              ) : (
                sortedRows.map((row) => (
                  <tr key={row.studentId} className="border-t border-border">
                    <td className="px-3 py-3">
                      <p className="font-medium">
                        {row.firstName} {row.lastName}
                      </p>
                      <p className="text-xs text-muted">
                        {row.rollNumber || row.admissionNumber}
                        {row.sectionName ? ` · ${row.sectionName}` : ""}
                      </p>
                    </td>
                    {subjects.map((subject) => {
                      const score = row.scores[subject.examSubjectId];
                      return (
                        <td
                          key={subject.examSubjectId}
                          className="px-3 py-3 tabular-nums"
                        >
                          {score?.isAbsent
                            ? "Ab"
                            : score?.marksObtained == null
                              ? "—"
                              : score.marksObtained}
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 tabular-nums">
                      {row.complete
                        ? `${row.totalObtained}/${row.totalMax}`
                        : "—"}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      {row.percentage == null
                        ? "—"
                        : `${row.percentage.toFixed(1)}%`}
                    </td>
                    <td className="px-3 py-3">
                      {!row.complete ? (
                        <span className="text-muted">Incomplete</span>
                      ) : row.passed ? (
                        <span className="font-medium text-brand">Pass</span>
                      ) : (
                        <span className="font-medium text-red-600">Fail</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
