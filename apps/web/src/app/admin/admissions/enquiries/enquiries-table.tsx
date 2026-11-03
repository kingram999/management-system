"use client";

import { useMemo, useState } from "react";
import {
  SortableTh,
  sortRows,
  useSortableState,
} from "@/components/sortable-table";
import { Button } from "@/components/ui/button";
import type { AdmissionEnquiryRecord } from "@/lib/data/types";
import { updateEnquiryStatusAction } from "../actions";

type SortKey =
  | "student"
  | "guardian"
  | "phone"
  | "email"
  | "class"
  | "message"
  | "status"
  | "date";

export function EnquiriesTable({
  enquiries,
}: {
  enquiries: AdmissionEnquiryRecord[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { sortKey, sortDir, toggleSort } = useSortableState<SortKey>("date");
  const sorted = useMemo(
    () =>
      sortRows(enquiries, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "student":
            return row.student_name;
          case "guardian":
            return row.guardian_name;
          case "phone":
            return row.phone;
          case "email":
            return row.email;
          case "class":
            return row.interested_class;
          case "message":
            return row.message;
          case "status":
            return row.status;
          case "date":
            return row.created_at;
        }
      }),
    [enquiries, sortKey, sortDir],
  );

  async function setStatus(
    enquiryId: string,
    status: "CONTACTED" | "CLOSED" | "PENDING",
  ) {
    setError(null);
    setPendingId(enquiryId);
    const formData = new FormData();
    formData.set("enquiryId", enquiryId);
    formData.set("status", status);
    const result = await updateEnquiryStatusAction(formData);
    setPendingId(null);
    if (result.error) {
      setError(result.error);
    }
  }

  if (enquiries.length === 0) {
    return (
      <div className="rounded-xl border border-border px-4 py-10 text-center text-sm text-muted">
        No enquiries yet. Public website will post here later.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">S.No</th>
              <SortableTh columnKey="student" label="Student" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="guardian" label="Guardian" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="phone" label="Phone" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="email" label="Email" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="class" label="Class" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="message" label="Message" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableTh columnKey="date" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, index) => (
              <tr key={row.id} className="border-t border-border align-top">
                <td className="px-4 py-3 tabular-nums text-muted">
                  {index + 1}
                </td>
                <td className="px-4 py-3 font-medium">{row.student_name}</td>
                <td className="px-4 py-3 text-muted">{row.guardian_name}</td>
                <td className="px-4 py-3 tabular-nums text-muted">{row.phone}</td>
                <td className="px-4 py-3 text-muted">{row.email || "—"}</td>
                <td className="px-4 py-3 text-muted">
                  {row.interested_class || "—"}
                </td>
                <td className="max-w-[220px] px-4 py-3 text-muted">
                  <span className="line-clamp-2">{row.message || "—"}</span>
                </td>
                <td className="px-4 py-3 text-muted">
                  {row.status.replaceAll("_", " ")}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted">
                  {new Date(row.created_at).toLocaleDateString("en-IN")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-1">
                    {row.status === "PENDING" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={pendingId === row.id}
                        onClick={() => void setStatus(row.id, "CONTACTED")}
                      >
                        Mark contacted
                      </Button>
                    ) : null}
                    {row.status !== "CLOSED" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={pendingId === row.id}
                        onClick={() => void setStatus(row.id, "CLOSED")}
                      >
                        Close
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={pendingId === row.id}
                        onClick={() => void setStatus(row.id, "PENDING")}
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
