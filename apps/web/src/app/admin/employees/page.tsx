import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatInr } from "@/lib/class-levels";
import { getEmployeesOverview } from "@/lib/data/employees";

export default async function EmployeesOverviewPage() {
  const profile = await requireAdmin();
  const overview = await getEmployeesOverview(profile.school_id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="display-font text-3xl">Employees</h2>
        <p className="mt-1 text-sm text-muted">
          Staff directory, attendance, and salary payments
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Active staff</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {overview.staff}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Teachers</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {overview.teachers}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Present today</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-brand">
            {overview.presentToday}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Salary paid this month</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatInr(overview.salaryPaidThisMonth)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/employees/directory"
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-card"
        >
          Open directory
        </Link>
        <Link
          href="/admin/employees/attendance"
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-card"
        >
          Mark attendance
        </Link>
        <Link
          href="/admin/employees/payroll"
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-card"
        >
          Payroll
        </Link>
      </div>
    </div>
  );
}
