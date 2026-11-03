"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { assignmentRuleLabel } from "@/lib/assignment-rules";
import type { StudentDirectoryRow } from "@/lib/data/students";
import { assignSectionsAction } from "../actions";
import {
  AssignFiltersBar,
  AssignRuleBanner,
  AssignStudentsTable,
  useAssignFilters,
  type AssignClassOption,
} from "../assign-shared";

export function AssignSectionsClient({
  students,
  classes,
  sectionRule,
}: {
  students: StudentDirectoryRow[];
  classes: AssignClassOption[];
  sectionRule: string;
}) {
  const router = useRouter();
  const state = useAssignFilters(students, classes);
  const [mode, setMode] = useState<"SETTINGS" | "MANUAL">("SETTINGS");
  const [targetSectionId, setTargetSectionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetSections = useMemo(() => {
    return classes.find((item) => item.id === state.classId)?.sections ?? [];
  }, [classes, state.classId]);

  async function onAssign() {
    setMessage(null);
    setError(null);

    if (!state.classId) {
      setError("Select a class filter before assigning sections.");
      return;
    }
    if (state.selected.length === 0) {
      setError("Select at least one student.");
      return;
    }
    if (mode === "MANUAL" && !targetSectionId) {
      setError("Choose a target section for manual assignment.");
      return;
    }

    const outsideClass = state.selected.filter((id) => {
      const row = students.find((s) => s.id === id);
      return row?.class_id !== state.classId;
    });
    if (outsideClass.length) {
      setError("All selected students must belong to the filtered class.");
      return;
    }

    const confirmLabel =
      mode === "MANUAL"
        ? `manual section ${
            targetSections.find((s) => s.id === targetSectionId)?.name ?? ""
          }`
        : `settings (${assignmentRuleLabel(sectionRule)})`;

    if (
      !window.confirm(
        `Assign ${state.selected.length} students to sections using ${confirmLabel}?`,
      )
    ) {
      return;
    }

    setLoading(true);
    const result = await assignSectionsAction({
      classId: state.classId,
      studentIds: state.selected,
      mode,
      sectionId: mode === "MANUAL" ? targetSectionId : null,
    });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage(`Updated sections for ${result.updated} students.`);
    state.setSelected([]);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="display-font text-3xl">Assign sections</h2>
        <p className="mt-1 text-sm text-muted">
          Filter a class, select students, then assign sections by settings or
          manually
        </p>
      </div>

      <AssignRuleBanner
        label="Section assignment rule"
        ruleLabel={assignmentRuleLabel(sectionRule)}
      />

      <AssignFiltersBar classes={classes} state={state} requireClass />

      <div className="grid max-w-2xl gap-4 rounded-xl border border-border bg-background p-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="assignMode">Assignment mode</Label>
          <select
            id="assignMode"
            value={mode}
            onChange={(e) =>
              setMode(e.target.value === "MANUAL" ? "MANUAL" : "SETTINGS")
            }
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="SETTINGS">By settings</option>
            <option value="MANUAL">Manual (one section)</option>
          </select>
        </div>
        {mode === "MANUAL" ? (
          <div>
            <Label htmlFor="targetSection">Target section</Label>
            <select
              id="targetSection"
              value={targetSectionId}
              onChange={(e) => setTargetSectionId(e.target.value)}
              disabled={!state.classId}
              className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="">Select section</option>
              {targetSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

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
            {loading ? "Assigning…" : "Assign sections"}
          </Button>
        }
      />

      {message ? <p className="text-sm text-brand">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
