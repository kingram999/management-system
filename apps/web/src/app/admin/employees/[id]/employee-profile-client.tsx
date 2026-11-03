"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatInr } from "@/lib/class-levels";
import type {
  EmployeeRecord,
  EmployeeSalaryPayment,
} from "@/lib/data/employees";
import {
  activateEmployeeLoginAction,
  createEmployeeLoginAction,
  deactivateEmployeeLoginAction,
  deleteEmployeeAction,
  updateEmployeeAction,
} from "../actions";

export function EmployeeProfileClient({
  employee,
  payments,
}: {
  employee: EmployeeRecord;
  payments: EmployeeSalaryPayment[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(
    action: (formData: FormData) => Promise<{ error?: string }>,
    formData: FormData,
    successMessage: string,
  ) {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await action(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage(successMessage);
  }

  return (
    <div className="mt-3 space-y-6">
      <div>
        <h2 className="display-font text-3xl">
          {employee.first_name} {employee.last_name}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {[employee.employee_code, employee.designation, employee.category]
            .filter(Boolean)
            .join(" · ")}
          {` · ${employee.status.replaceAll("_", " ")}`}
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      <form
        className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-3"
        action={async (formData) => {
          formData.set("id", employee.id);
          await run(updateEmployeeAction, formData, "Employee updated.");
        }}
      >
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            name="firstName"
            required
            defaultValue={employee.first_name}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            name="lastName"
            required
            defaultValue={employee.last_name}
          />
        </div>
        <div>
          <Label htmlFor="employeeCode">Employee code</Label>
          <Input
            id="employeeCode"
            name="employeeCode"
            defaultValue={employee.employee_code ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="designation">Designation</Label>
          <Input
            id="designation"
            name="designation"
            required
            defaultValue={employee.designation}
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={employee.category}
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="TEACHER">Teacher</option>
            <option value="STAFF">Staff</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={employee.status}
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On leave</option>
            <option value="INACTIVE">Inactive</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            name="department"
            defaultValue={employee.department ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={employee.phone ?? ""} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={employee.email ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            defaultValue={employee.date_of_birth?.slice(0, 10) ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="joinedOn">Joined on</Label>
          <Input
            id="joinedOn"
            name="joinedOn"
            type="date"
            defaultValue={employee.joined_on?.slice(0, 10) ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="monthlySalary">Monthly salary (₹)</Label>
          <Input
            id="monthlySalary"
            name="monthlySalary"
            type="number"
            min={0}
            defaultValue={employee.monthly_salary}
          />
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            name="gender"
            defaultValue={employee.gender ?? ""}
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="">—</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={employee.address ?? ""}
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
          <Button type="submit" disabled={pending}>
            Save changes
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={async () => {
              if (!window.confirm("Soft-delete this employee?")) return;
              const formData = new FormData();
              formData.set("id", employee.id);
              await run(deleteEmployeeAction, formData, "Employee deleted.");
            }}
          >
            Delete
          </Button>
        </div>
      </form>

      <section className="space-y-3 rounded-xl border border-border p-4">
        <div>
          <h3 className="font-semibold">Login account</h3>
          <p className="mt-1 text-sm text-muted">
            {employee.profile_id
              ? `${employee.login_email || "Linked"} · ${
                  employee.login_active ? "Active" : "Inactive"
                }`
              : "No login linked yet. Requires an email on this profile."}
          </p>
        </div>

        {!employee.profile_id ? (
          <form
            className="flex flex-wrap items-end gap-3"
            action={async (formData) => {
              formData.set("employeeId", employee.id);
              await run(
                createEmployeeLoginAction,
                formData,
                "Login created.",
              );
            }}
          >
            <div>
              <Label htmlFor="temporaryPassword">Temporary password</Label>
              <Input
                id="temporaryPassword"
                name="temporaryPassword"
                type="password"
                required
                minLength={8}
                placeholder="Min 8 characters"
              />
            </div>
            <Button type="submit" size="sm" disabled={pending}>
              Create login
            </Button>
          </form>
        ) : (
          <div className="flex flex-wrap gap-2">
            {employee.login_active ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={async () => {
                  const formData = new FormData();
                  formData.set("employeeId", employee.id);
                  await run(
                    deactivateEmployeeLoginAction,
                    formData,
                    "Login deactivated.",
                  );
                }}
              >
                Deactivate login
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={async () => {
                  const formData = new FormData();
                  formData.set("employeeId", employee.id);
                  await run(
                    activateEmployeeLoginAction,
                    formData,
                    "Login activated.",
                  );
                }}
              >
                Activate login
              </Button>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-border p-4">
        <div>
          <h3 className="font-semibold">Salary payments</h3>
          <p className="mt-1 text-sm text-muted">
            Monthly salary {formatInr(employee.monthly_salary)}
          </p>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-background text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Period</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Method</th>
                <th className="px-3 py-2 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-muted"
                  >
                    No payments recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-border">
                    <td className="px-3 py-2 tabular-nums">
                      {payment.paid_on.slice(0, 10)}
                    </td>
                    <td className="px-3 py-2">
                      {payment.period_label || "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatInr(payment.amount)}
                    </td>
                    <td className="px-3 py-2">{payment.method || "—"}</td>
                    <td className="px-3 py-2 text-muted">
                      {payment.note || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
