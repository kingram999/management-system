"use client";

import { useState } from "react";
import { updateApplicationStatus } from "../actions";

export function ReviewActions({
  applicationId,
  sections,
}: {
  applicationId: string;
  sections: { id: string; name: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(status: string, formData: FormData) {
    setLoading(true);
    setError(null);
    setMessage(null);
    formData.set("applicationId", applicationId);
    formData.set("status", status);
    const result = await updateApplicationStatus(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage(`Marked as ${status.replaceAll("_", " ")}.`);
  }

  return (
    <div className="space-y-4">
      <form
        action={async (formData) => run("APPROVED", formData)}
        className="grid gap-3 rounded-lg bg-background p-4 sm:grid-cols-3"
      >
        <label className="block sm:col-span-1">
          <span className="mb-1 block text-sm font-medium">Section (optional)</span>
          <select name="sectionId" className="w-full rounded-lg border border-border px-3 py-2 text-sm">
            <option value="">Assign later</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Review notes</span>
          <input
            name="reviewNotes"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Optional notes"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-3 sm:w-fit"
        >
          Approve admission
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <form action={async (formData) => run("UNDER_REVIEW", formData)}>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
          >
            Mark under review
          </button>
        </form>
        <form action={async (formData) => run("WAITLISTED", formData)}>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
          >
            Waitlist
          </button>
        </form>
      </div>

      <form
        action={async (formData) => run("REJECTED", formData)}
        className="grid gap-3 rounded-lg border border-danger/20 bg-red-50/50 p-4 sm:grid-cols-3"
      >
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Rejection reason</span>
          <input
            name="rejectionReason"
            required
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Reason for rejection"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:self-end"
        >
          Reject
        </button>
      </form>

      {message ? <p className="text-sm text-brand">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
