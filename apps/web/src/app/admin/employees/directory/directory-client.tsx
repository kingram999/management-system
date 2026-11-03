"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  SortableTh,
  sortRows,
  useSortableState,
} from "@/components/sortable-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatInr } from "@/lib/class-levels";
import type { EmployeeRecord } from "@/lib/data/employees";
import { createEmployeeAction } from "../actions";

type SortKey =
  | "name"
  | "code"
  | "category"
  | "designation"
  | "status"
  | "salary"
  | "login";

export function EmployeeDirectoryClient({
  employees,
}: {
  employees: EmployeeRecord[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { sortKey, sortDir, toggleSort } = useSortableState<SortKey>("name");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((row) => {
      if (category && row.category !== category) return false;
      if (status && row.status !== status) return false;
      if (!q) return true;
      const haystack = [
        row.first_name,
        row.last_name,
        `${row.first_name} ${row.last_name}`,
        row.employee_code,
        row.designation,
        row.department,
        row.email,
        row.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [employees, search, category, status]);

  const sorted = useMemo(
    () =>
      sortRows(filtered, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "name":
            return `${row.last_name} ${row.first_name}`;
          case "code":
            return row.employee_code;
          case "category":
            return row.category;
          case "designation":
            return row.designation;
          case "status":
            return row.status;
          case "salary":
            return row.monthly_salary;
          case "login":
            return row.profile_id
              ? row.login_active
                ? "Active"
                : "Inactive"
              : "None";
        }
      }),
    [filtered, sortKey, sortDir],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="display-font text-3xl">Staff directory</h2>
          <p className="mt-1 text-sm text-muted">
            Search, filter, and open employee profiles
          </p>
        </div>
        <Button type="button" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "Close form" : "Add employee"}
        </Button>
      </div>

      {showAdd ? (
        <form
          className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4"
          action={async (formData) => {
            setPending(true);
            setError(null);
            setMessage(null);
            const result = await createEmployeeAction(formData);
            setPending(false);
            if (result.error) {
              setError(result.error);
              return;
            }
            setMessage("Employee added.");
            setShowAdd(false);
          }}
        >
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" name="firstName" required />
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" name="lastName" required />
          </div>
          <div>
            <Label htmlFor="employeeCode">Employee code</Label>
            <Input id="employeeCode" name="employeeCode" placeholder="EMP-001" />
          </div>
          <div>
            <Label htmlFor="designation">Designation</Label>
            <Input
              id="designation"
              name="designation"
              required
              placeholder="Class Teacher"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              defaultValue="TEACHER"
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="TEACHER">Teacher</option>
              <option value="STAFF">Staff</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Input id="department" name="department" placeholder="Primary" />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" />
          </div>
          <div>
            <Label htmlFor="joinedOn">Joined on</Label>
            <Input id="joinedOn" name="joinedOn" type="date" />
          </div>
          <div>
            <Label htmlFor="monthlySalary">Monthly salary (₹)</Label>
            <Input
              id="monthlySalary"
              name="monthlySalary"
              type="number"
              min={0}
              defaultValue={0}
            />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              name="gender"
              defaultValue=""
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="">—</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" disabled={pending}>
              Save employee
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-3">
        <Input
          placeholder="Search name, code, designation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">All categories</option>
          <option value="TEACHER">Teacher</option>
          <option value="STAFF">Staff</option>
          <option value="OTHER">Other</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_LEAVE">On leave</option>
          <option value="INACTIVE">Inactive</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      <p className="text-sm text-muted tabular-nums">
        {sorted.length} employees
      </p>

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
              <SortableTh
                columnKey="category"
                label="Category"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                columnKey="designation"
                label="Designation"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                columnKey="status"
                label="Status"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                columnKey="salary"
                label="Salary"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                columnKey="login"
                label="Login"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No employees match these filters.
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/employees/${row.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {row.first_name} {row.last_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted">
                    {row.employee_code || "—"}
                  </td>
                  <td className="px-4 py-3">{row.category}</td>
                  <td className="px-4 py-3">{row.designation}</td>
                  <td className="px-4 py-3">
                    {row.status.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatInr(row.monthly_salary)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {row.profile_id
                      ? row.login_active
                        ? "Active"
                        : "Inactive"
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
