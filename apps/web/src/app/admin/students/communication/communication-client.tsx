"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SortableTh,
  sortRows,
  useSortableState,
} from "@/components/sortable-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CommunicationMessageListItem } from "@/lib/data/communication";
import type { StudentDirectoryRow } from "@/lib/data/students";
import { sendGuardianMessageAction } from "../actions";
import {
  AssignFiltersBar,
  AssignStudentsTable,
  useAssignFilters,
  type AssignClassOption,
} from "../assign-shared";

type MsgSortKey = "date" | "subject" | "audience" | "recipients" | "sender";

export function CommunicationClient({
  students,
  classes,
  messages,
}: {
  students: StudentDirectoryRow[];
  classes: AssignClassOption[];
  messages: CommunicationMessageListItem[];
}) {
  const router = useRouter();
  const state = useAssignFilters(students, classes);
  const [audience, setAudience] = useState<"SINGLE" | "GROUP">("SINGLE");
  const [singleStudentId, setSingleStudentId] = useState("");
  const [singleQuery, setSingleQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { sortKey, sortDir, toggleSort } =
    useSortableState<MsgSortKey>("date");
  const sortedMessages = useMemo(
    () =>
      sortRows(messages, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "date":
            return row.created_at;
          case "subject":
            return row.subject;
          case "audience":
            return row.audience_type;
          case "recipients":
            return row.recipient_count;
          case "sender":
            return row.sender_name;
        }
      }),
    [messages, sortKey, sortDir],
  );

  const singleMatches = useMemo(() => {
    const q = singleQuery.trim().toLowerCase();
    if (!q) return students.slice(0, 20);
    return students
      .filter((student) => {
        const haystack = [
          student.first_name,
          student.last_name,
          `${student.first_name} ${student.last_name}`,
          student.admission_number,
          student.class_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 20);
  }, [students, singleQuery]);

  const selectedStudentIds =
    audience === "SINGLE"
      ? singleStudentId
        ? [singleStudentId]
        : []
      : state.selected;

  const filterSummary = useMemo(() => {
    if (audience === "SINGLE") {
      const student = students.find((s) => s.id === singleStudentId);
      if (!student) return null;
      return `${student.first_name} ${student.last_name} (${student.admission_number})`;
    }
    const parts = [
      state.classId
        ? classes.find((c) => c.id === state.classId)?.name
        : null,
      state.sectionId
        ? state.sections.find((s) => s.id === state.sectionId)?.name
        : null,
      state.status || null,
      state.gender || null,
      state.house ? `House ${state.house}` : null,
      `${selectedStudentIds.length} students`,
    ].filter(Boolean);
    return parts.join(" · ");
  }, [
    audience,
    singleStudentId,
    students,
    state.classId,
    state.sectionId,
    state.status,
    state.gender,
    state.house,
    state.sections,
    classes,
    selectedStudentIds.length,
  ]);

  async function onSend() {
    setMessage(null);
    setError(null);

    if (!subject.trim() || !body.trim()) {
      setError("Subject and message body are required.");
      return;
    }
    if (!selectedStudentIds.length) {
      setError("Select at least one student.");
      return;
    }

    if (
      !window.confirm(
        `Log this message for guardians of ${selectedStudentIds.length} student(s)? Delivery is log-only for now.`,
      )
    ) {
      return;
    }

    setLoading(true);
    const result = await sendGuardianMessageAction({
      subject,
      body,
      audienceType: audience,
      filterSummary,
      studentIds: selectedStudentIds,
    });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage(
      `Logged for ${result.recipientCount} guardians across ${result.studentCount} students.`,
    );
    setSubject("");
    setBody("");
    setSingleStudentId("");
    state.setSelected([]);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="display-font text-3xl">Communication</h2>
        <p className="mt-1 text-sm text-muted">
          Message one student’s guardians or a filtered group
        </p>
      </div>

      <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted">
        Messages are logged only; email/SMS delivery comes later.
      </p>

      <section className="space-y-4 rounded-xl border border-border bg-background p-4">
        <h3 className="text-lg font-semibold">Compose</h3>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={audience === "SINGLE" ? "primary" : "secondary"}
            onClick={() => setAudience("SINGLE")}
          >
            One student
          </Button>
          <Button
            type="button"
            size="sm"
            variant={audience === "GROUP" ? "primary" : "secondary"}
            onClick={() => setAudience("GROUP")}
          >
            Filtered group
          </Button>
        </div>

        {audience === "SINGLE" ? (
          <div className="grid max-w-xl gap-3">
            <div>
              <Label htmlFor="singleQuery">Find student</Label>
              <Input
                id="singleQuery"
                value={singleQuery}
                onChange={(e) => setSingleQuery(e.target.value)}
                placeholder="Search name or reg. ID…"
              />
            </div>
            <select
              value={singleStudentId}
              onChange={(e) => setSingleStudentId(e.target.value)}
              className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="">Select student</option>
              {singleMatches.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} ·{" "}
                  {student.admission_number}
                  {student.class_name ? ` · ${student.class_name}` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-4">
            <AssignFiltersBar classes={classes} state={state} />
            <AssignStudentsTable
              filtered={state.filtered}
              selected={state.selected}
              toggleSelect={state.toggleSelect}
              toggleSelectAllFiltered={state.toggleSelectAllFiltered}
            />
          </div>
        )}

        <div className="grid max-w-2xl gap-3">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="body">Message</Label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              required
            />
          </div>
          <p className="text-sm text-muted">
            Will log for guardians of {selectedStudentIds.length} student
            {selectedStudentIds.length === 1 ? "" : "s"}
            {filterSummary ? ` · ${filterSummary}` : ""}.
          </p>
          <div>
            <Button type="button" disabled={loading} onClick={onSend}>
              {loading ? "Saving…" : "Log message"}
            </Button>
          </div>
        </div>

        {message ? <p className="text-sm text-brand">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Sent log</h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-background text-muted">
              <tr>
                <SortableTh columnKey="date" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
                <SortableTh columnKey="subject" label="Subject" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
                <SortableTh columnKey="audience" label="Audience" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
                <SortableTh columnKey="recipients" label="Recipients" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
                <SortableTh columnKey="sender" label="Sender" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
                <th className="px-3 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {sortedMessages.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-muted"
                  >
                    No messages logged yet.
                  </td>
                </tr>
              ) : (
                sortedMessages.map((item) => (
                  <Fragment key={item.id}>
                    <tr className="border-t border-border hover:bg-background/70">
                      <td className="whitespace-nowrap px-3 py-3 text-muted">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-3 font-medium">{item.subject}</td>
                      <td className="px-3 py-3 text-muted">
                        {item.audience_type === "SINGLE" ? "One student" : "Group"}
                        {item.filter_summary
                          ? ` · ${item.filter_summary}`
                          : ""}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-muted">
                        {item.recipient_count}
                      </td>
                      <td className="px-3 py-3 text-muted">
                        {item.sender_name || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setExpandedId((id) =>
                              id === item.id ? null : item.id,
                            )
                          }
                        >
                          {expandedId === item.id ? "Hide" : "Details"}
                        </Button>
                      </td>
                    </tr>
                    {expandedId === item.id ? (
                      <tr className="border-t border-border bg-background/50">
                        <td colSpan={6} className="px-4 py-4">
                          <p className="mb-3 whitespace-pre-wrap text-sm">
                            {item.body}
                          </p>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-xs">
                              <thead className="text-muted">
                                <tr>
                                  <th className="px-2 py-1 font-medium">
                                    Student
                                  </th>
                                  <th className="px-2 py-1 font-medium">
                                    Guardian
                                  </th>
                                  <th className="px-2 py-1 font-medium">
                                    Phone
                                  </th>
                                  <th className="px-2 py-1 font-medium">
                                    Email
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.recipients.map((recipient) => (
                                  <tr key={recipient.id}>
                                    <td className="px-2 py-1">
                                      {recipient.student_name}
                                    </td>
                                    <td className="px-2 py-1">
                                      {recipient.guardian_name}
                                    </td>
                                    <td className="px-2 py-1 tabular-nums">
                                      {recipient.guardian_phone || "—"}
                                    </td>
                                    <td className="px-2 py-1">
                                      {recipient.guardian_email || "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
