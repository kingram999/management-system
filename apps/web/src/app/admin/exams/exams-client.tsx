"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SortableTh,
  sortRows,
  useSortableState,
} from "@/components/sortable-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExamSubjectRecord, ExamTermRecord } from "@/lib/data/exams";
import type { SubjectRecord } from "@/lib/data/subjects";

type SubjectSortKey = "subject" | "max" | "pass";
import {
  createExamTermAction,
  deleteExamSubjectAction,
  setExamTermLockedAction,
  upsertExamSubjectAction,
} from "./actions";

type ClassOption = {
  id: string;
  name: string;
  sections: Array<{ id: string; name: string }>;
};

export function ExamsClient({
  academicYearId,
  yearName,
  terms,
  subjects,
  classes,
  selectedTermId,
  examSubjects,
}: {
  academicYearId: string;
  yearName: string;
  terms: ExamTermRecord[];
  subjects: SubjectRecord[];
  classes: ClassOption[];
  selectedTermId: string;
  examSubjects: ExamSubjectRecord[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [createClassId, setCreateClassId] = useState("ALL");
  const [createSectionId, setCreateSectionId] = useState("");
  const allClasses = createClassId === "ALL";

  const selectedTerm = terms.find((t) => t.id === selectedTermId) ?? null;
  const {
    sortKey: subjectSortKey,
    sortDir: subjectSortDir,
    toggleSort: toggleSubjectSort,
  } = useSortableState<SubjectSortKey>("subject");
  const sortedExamSubjects = useMemo(
    () =>
      sortRows(examSubjects, subjectSortKey, subjectSortDir, (row, key) => {
        switch (key) {
          case "subject":
            return row.subject_name;
          case "max":
            return row.max_marks;
          case "pass":
            return row.pass_marks;
        }
      }),
    [examSubjects, subjectSortKey, subjectSortDir],
  );
  const createSections = useMemo(
    () =>
      allClasses
        ? []
        : (classes.find((c) => c.id === createClassId)?.sections ?? []),
    [classes, createClassId, allClasses],
  );

  async function run(
    action: (
      formData: FormData,
    ) => Promise<{ error?: string; message?: string }>,
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
        return;
      }
      setMessage(result.message || successMessage);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  function scopeLabel(term: ExamTermRecord) {
    if (!term.class_name) return "No class";
    return term.section_name
      ? `${term.class_name} · Sec ${term.section_name}`
      : `${term.class_name} · All sections`;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="display-font text-3xl">Exams</h2>
        <p className="mt-1 text-sm text-muted">
          Create exams for a class (optional section) in {yearName}, then attach
          subjects with max and pass marks.
        </p>
      </div>

      <form
        className="space-y-3 rounded-xl border border-border bg-background p-4"
        action={async (formData) => {
          formData.set("academicYearId", academicYearId);
          if (allClasses) formData.set("sectionId", "");
          await run(createExamTermAction, formData, "Exam created.");
          setCreateClassId("ALL");
          setCreateSectionId("");
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="classId">Class</Label>
            <select
              id="classId"
              name="classId"
              required
              value={createClassId}
              onChange={(e) => {
                setCreateClassId(e.target.value);
                setCreateSectionId("");
              }}
              className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="ALL">All</option>
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
              name="sectionId"
              value={allClasses ? "" : createSectionId}
              disabled={allClasses}
              onChange={(e) => setCreateSectionId(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm disabled:opacity-60"
            >
              <option value="">All sections</option>
              {createSections.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="name">Examination name</Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="Half Yearly / Unit Test"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="startDate">Start</Label>
            <Input id="startDate" name="startDate" type="date" />
          </div>
          <div>
            <Label htmlFor="endDate">End</Label>
            <Input id="endDate" name="endDate" type="date" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            Add
          </Button>
        </div>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-brand">{message}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Exams
          </p>
          {terms.length === 0 ? (
            <p className="text-sm text-muted">No exams yet.</p>
          ) : (
            <ul className="space-y-1">
              {terms.map((term) => (
                <li key={term.id}>
                  <Link
                    href={`/admin/exams?termId=${term.id}`}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      term.id === selectedTermId
                        ? "bg-brand font-medium text-white"
                        : "hover:bg-card"
                    }`}
                  >
                    <span className="block">{term.name}</span>
                    <span
                      className={`block text-[11px] ${
                        term.id === selectedTermId
                          ? "text-white/80"
                          : "text-muted"
                      }`}
                    >
                      {scopeLabel(term)}
                      {term.is_locked ? " · Locked" : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          {!selectedTerm ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
              Select or create an exam to manage subjects.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
                <div>
                  <h3 className="font-semibold">{selectedTerm.name}</h3>
                  <p className="text-xs text-muted">
                    {scopeLabel(selectedTerm)}
                    {[selectedTerm.start_date, selectedTerm.end_date]
                      .filter(Boolean)
                      .length
                      ? ` · ${[selectedTerm.start_date, selectedTerm.end_date]
                          .filter(Boolean)
                          .join(" → ")}`
                      : ""}
                  </p>
                </div>
                <form
                  action={async (formData) => {
                    formData.set("id", selectedTerm.id);
                    formData.set(
                      "isLocked",
                      selectedTerm.is_locked ? "false" : "true",
                    );
                    await run(
                      setExamTermLockedAction,
                      formData,
                      selectedTerm.is_locked ? "Exam unlocked." : "Exam locked.",
                    );
                  }}
                >
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                  >
                    {selectedTerm.is_locked ? "Unlock" : "Lock exam"}
                  </Button>
                </form>
              </div>

              {!selectedTerm.is_locked && selectedTerm.class_id ? (
                <form
                  className="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-4"
                  action={async (formData) => {
                    formData.set("examTermId", selectedTerm.id);
                    formData.set("classId", selectedTerm.class_id!);
                    await run(
                      upsertExamSubjectAction,
                      formData,
                      "Subject attached.",
                    );
                  }}
                >
                  <div>
                    <Label htmlFor="subjectId">Subject</Label>
                    <select
                      id="subjectId"
                      name="subjectId"
                      required
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
                  <div>
                    <Label htmlFor="maxMarks">Max</Label>
                    <Input
                      id="maxMarks"
                      name="maxMarks"
                      type="number"
                      min={1}
                      step="0.5"
                      required
                      defaultValue={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="passMarks">Pass</Label>
                    <Input
                      id="passMarks"
                      name="passMarks"
                      type="number"
                      min={0}
                      step="0.5"
                      required
                      defaultValue={33}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="submit"
                      disabled={pending || subjects.length === 0}
                    >
                      Attach
                    </Button>
                  </div>
                </form>
              ) : null}

              {!selectedTerm.class_id ? (
                <p className="text-sm text-muted">
                  This exam has no class. Create a new exam with a class selected.
                </p>
              ) : null}

              {subjects.length === 0 ? (
                <p className="text-sm text-muted">
                  Add subjects first in{" "}
                  <Link
                    href="/admin/settings/examination"
                    className="text-brand"
                  >
                    Examination Settings
                  </Link>
                  .
                </p>
              ) : null}

              <h4 className="font-medium">Attached subjects</h4>

              <div className="overflow-hidden rounded-xl border border-border">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-background text-muted">
                    <tr>
                      <SortableTh
                        columnKey="subject"
                        label="Subject"
                        sortKey={subjectSortKey}
                        sortDir={subjectSortDir}
                        onSort={toggleSubjectSort}
                      />
                      <SortableTh
                        columnKey="max"
                        label="Max"
                        sortKey={subjectSortKey}
                        sortDir={subjectSortDir}
                        onSort={toggleSubjectSort}
                      />
                      <SortableTh
                        columnKey="pass"
                        label="Pass"
                        sortKey={subjectSortKey}
                        sortDir={subjectSortDir}
                        onSort={toggleSubjectSort}
                      />
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedExamSubjects.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-muted"
                        >
                          No subjects attached yet.
                        </td>
                      </tr>
                    ) : (
                      sortedExamSubjects.map((row) => (
                        <tr key={row.id} className="border-t border-border">
                          <td className="px-4 py-3 font-medium">
                            {row.subject_name}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {row.max_marks}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {row.pass_marks}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!selectedTerm.is_locked ? (
                              <form
                                action={async (formData) => {
                                  if (
                                    !window.confirm(
                                      "Remove this subject from the exam?",
                                    )
                                  ) {
                                    return;
                                  }
                                  formData.set("id", row.id);
                                  await run(
                                    deleteExamSubjectAction,
                                    formData,
                                    "Subject removed.",
                                  );
                                }}
                              >
                                <Button
                                  type="submit"
                                  size="sm"
                                  variant="danger"
                                  disabled={pending}
                                >
                                  Remove
                                </Button>
                              </form>
                            ) : (
                              <span className="text-xs text-muted">Locked</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
