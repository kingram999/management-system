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
import type { SubjectRecord } from "@/lib/data/subjects";
import {
  createSubjectAction,
  deleteSubjectAction,
  updateSubjectAction,
} from "@/app/admin/exams/actions";

type SortKey = "name" | "code";

export function ExaminationSettingsClient({
  subjects,
}: {
  subjects: SubjectRecord[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { sortKey, sortDir, toggleSort } = useSortableState<SortKey>("name");
  const sorted = useMemo(
    () =>
      sortRows(subjects, sortKey, sortDir, (row, key) =>
        key === "name" ? row.name : row.code,
      ),
    [subjects, sortKey, sortDir],
  );

  async function run(
    action: (formData: FormData) => Promise<{ error?: string }>,
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
      setMessage(successMessage);
      setEditingId(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="display-font text-3xl">Examination Settings</h2>
        <p className="mt-1 text-sm text-muted">
          School-wide subject catalog used for exams and marks
        </p>
      </div>

      <form
        className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-3"
        action={async (formData) => {
          await run(createSubjectAction, formData, "Subject added.");
        }}
      >
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="Mathematics" />
        </div>
        <div>
          <Label htmlFor="code">Code (optional)</Label>
          <Input id="code" name="code" placeholder="MATH" />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={pending}>
            Add subject
          </Button>
        </div>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <SortableTh
                columnKey="name"
                label="Name"
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
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted">
                  No subjects yet. Add the first one above.
                </td>
              </tr>
            ) : (
              sorted.map((subject) =>
                editingId === subject.id ? (
                  <tr key={subject.id} className="border-t border-border">
                    <td colSpan={3} className="px-4 py-3">
                      <form
                        className="flex flex-wrap items-end gap-3"
                        action={async (formData) => {
                          formData.set("id", subject.id);
                          await run(
                            updateSubjectAction,
                            formData,
                            "Subject updated.",
                          );
                        }}
                      >
                        <div>
                          <Label htmlFor={`name-${subject.id}`}>Name</Label>
                          <Input
                            id={`name-${subject.id}`}
                            name="name"
                            required
                            defaultValue={subject.name}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`code-${subject.id}`}>Code</Label>
                          <Input
                            id={`code-${subject.id}`}
                            name="code"
                            defaultValue={subject.code ?? ""}
                          />
                        </div>
                        <Button type="submit" size="sm" disabled={pending}>
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
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={subject.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{subject.name}</td>
                    <td className="px-4 py-3 text-muted">
                      {subject.code || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingId(subject.id)}
                        >
                          Edit
                        </Button>
                        <form
                          action={async (formData) => {
                            if (!window.confirm("Delete this subject?")) return;
                            formData.set("id", subject.id);
                            await run(
                              deleteSubjectAction,
                              formData,
                              "Subject deleted.",
                            );
                          }}
                        >
                          <Button
                            type="submit"
                            size="sm"
                            variant="danger"
                            disabled={pending}
                          >
                            Delete
                          </Button>
                        </form>
                      </div>
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
