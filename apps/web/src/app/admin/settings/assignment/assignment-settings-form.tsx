"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ASSIGNMENT_RULES, type AssignmentRule } from "@/lib/assignment-rules";
import { updateAssignmentSettings } from "../actions";

export function AssignmentSettingsForm({
  sectionAssignmentRule,
  rollNumberAssignmentRule,
}: {
  sectionAssignmentRule: AssignmentRule;
  rollNumberAssignmentRule: AssignmentRule;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    setError(null);
    const result = await updateAssignmentSettings(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage("Assignment settings saved.");
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="display-font text-3xl">Assignment settings</h2>
          <p className="mt-1 text-sm text-muted">
            Choose how students are assigned to sections and roll numbers
          </p>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save settings"}
        </Button>
      </div>

      <div className="grid max-w-xl gap-4">
        <div>
          <Label htmlFor="sectionAssignmentRule">Section assignment</Label>
          <select
            id="sectionAssignmentRule"
            name="sectionAssignmentRule"
            defaultValue={sectionAssignmentRule}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            {ASSIGNMENT_RULES.map((rule) => (
              <option key={rule.value} value={rule.value}>
                {rule.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="rollNumberAssignmentRule">
            Roll number assignment
          </Label>
          <select
            id="rollNumberAssignmentRule"
            name="rollNumberAssignmentRule"
            defaultValue={rollNumberAssignmentRule}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            {ASSIGNMENT_RULES.map((rule) => (
              <option key={rule.value} value={rule.value}>
                {rule.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-muted">
          Marks-based rules can be selected now; they will apply once marks data
          is available. Promote and Assign section will use these settings later.
        </p>
      </div>

      {message ? <p className="text-sm text-brand">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
