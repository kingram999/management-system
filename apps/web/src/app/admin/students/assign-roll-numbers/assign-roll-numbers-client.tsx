"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { assignmentRuleLabel } from "@/lib/assignment-rules";
import type { StudentDirectoryRow } from "@/lib/data/students";
import { assignRollNumbersAction } from "../actions";
import {
  AssignFiltersBar,
  AssignRuleBanner,
  AssignStudentsTable,
  useAssignFilters,
  type AssignClassOption,
} from "../assign-shared";

export function AssignRollNumbersClient({
  students,
  classes,
  rollRule,
}: {
  students: StudentDirectoryRow[];
  classes: AssignClassOption[];
  rollRule: string;
}) {
  const router = useRouter();
  const state = useAssignFilters(students, classes);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onAssign() {
    setMessage(null);
    setError(null);

    if (state.selected.length === 0) {
      setError("Select at least one student.");
      return;
    }

    if (
      !window.confirm(
        `Assign roll numbers to ${state.selected.length} students using ${assignmentRuleLabel(rollRule)} (per section, starting at 1)?`,
      )
    ) {
      return;
    }

    setLoading(true);
    const result = await assignRollNumbersAction({
      studentIds: state.selected,
    });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const skippedNote =
      result.skipped && result.skipped > 0
        ? ` Skipped ${result.skipped} without a section.`
        : "";
    setMessage(
      `Updated roll numbers for ${result.updated} students.${skippedNote}`,
    );
    state.setSelected([]);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="display-font text-3xl">Assign Roll Numbers</h2>
        <p className="mt-1 text-sm text-muted">
          Select students and renumber rolls within each section using
          Assignment settings
        </p>
      </div>

      <AssignRuleBanner
        label="Roll number assignment rule"
        ruleLabel={assignmentRuleLabel(rollRule)}
      />

      <AssignFiltersBar classes={classes} state={state} />

      <AssignStudentsTable
        filtered={state.filtered}
        selected={state.selected}
        toggleSelect={state.toggleSelect}
        toggleSelectAllFiltered={state.toggleSelectAllFiltered}
        toolbar={
          <Button
            type="button"
            size="sm"
            disabled={loading || state.selected.length === 0}
            onClick={onAssign}
          >
            {loading ? "Assigning…" : "Assign roll numbers"}
          </Button>
        }
      />

      {message ? <p className="text-sm text-brand">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
