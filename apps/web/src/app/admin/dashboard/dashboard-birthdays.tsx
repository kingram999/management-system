"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { BirthdayPerson } from "@/lib/data/dashboard";

export function DashboardBirthdays({
  students,
  employees,
}: {
  students: BirthdayPerson[];
  employees: BirthdayPerson[];
}) {
  const [open, setOpen] = useState(false);
  const total = students.length + employees.length;

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Today&apos;s birthdays</h3>
          <p className="mt-1 text-sm text-muted">
            {total === 0
              ? "No birthdays today."
              : `${total} celebration${total === 1 ? "" : "s"} today`}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide" : "View"}
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-border bg-card px-3 py-4 text-left transition hover:border-brand"
        >
          <p className="text-xs text-muted">Students</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {students.length}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-border bg-card px-3 py-4 text-left transition hover:border-brand"
        >
          <p className="text-xs text-muted">Employees</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {employees.length}
          </p>
        </button>
      </div>

      {open ? (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <BirthdayList title="Students" people={students} />
          <BirthdayList title="Employees" people={employees} emptyHint="Employee records will appear here once the module is live." />
        </div>
      ) : null}
    </div>
  );
}

function BirthdayList({
  title,
  people,
  emptyHint = "None today.",
}: {
  title: string;
  people: BirthdayPerson[];
  emptyHint?: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      {people.length === 0 ? (
        <p className="mt-1 text-sm text-muted">{emptyHint}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {people.map((person) => (
            <li
              key={person.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span>{person.name}</span>
              {person.detail ? (
                <span className="text-xs text-muted">{person.detail}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
