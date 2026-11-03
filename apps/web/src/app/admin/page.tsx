import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStats } from "@/lib/data/dashboard";
import { listSchoolEventsForMonth } from "@/lib/data/school-events";
import { AnnualFeeBars, IncomeExpenseDonut } from "./dashboard/dashboard-charts";
import { DashboardCalendar } from "./dashboard/dashboard-calendar";
import { DashboardBirthdays } from "./dashboard/dashboard-birthdays";
import { DashboardPendingFees } from "./dashboard/dashboard-pending-fees";
import { DashboardQuickActions } from "./dashboard/dashboard-quick-actions";
import { RecentApplicationsTable } from "./dashboard/recent-applications-table";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const profile = await requireAdmin();
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;

  const [stats, events] = await Promise.all([
    getDashboardStats(profile.school_id),
    listSchoolEventsForMonth(profile.school_id, year, month),
  ]);

  const strength = [
    { label: "Students", value: stats.activeStudents },
    { label: "Teachers", value: stats.teachers },
    { label: "Employees", value: stats.employees },
    { label: "Parents / Guardians", value: stats.guardians },
  ];

  const admissionCards = [
    { label: "Pending review", value: stats.admissions.pending },
    { label: "Approved", value: stats.admissions.approved },
    { label: "Total applications", value: stats.admissions.total },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="display-font text-3xl">Dashboard</h2>
        <p className="mt-1 text-sm text-muted">{profile.school.name}</p>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">
          Quick actions
        </h3>
        <DashboardQuickActions />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AnnualFeeBars
          billed={stats.fee.billed}
          collected={stats.fee.collected}
          pending={stats.fee.pending}
        />
        <IncomeExpenseDonut
          income={stats.incomeExpense.income}
          expense={stats.incomeExpense.expense}
        />
      </section>

      <DashboardPendingFees rows={stats.pendingFeeStudents} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {strength.map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl border border-border bg-background px-4 py-5"
          >
            <p className="text-sm text-muted">{tile.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {tile.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardCalendar
          key={`${year}-${month}`}
          initialYear={year}
          initialMonth={month}
          events={events}
        />
        <DashboardBirthdays
          students={stats.studentBirthdaysToday}
          employees={stats.employeeBirthdaysToday}
        />
      </section>

      <section className="space-y-6 border-t border-border pt-8">
        <div>
          <h3 className="text-lg font-semibold">Admissions</h3>
          <p className="mt-1 text-sm text-muted">
            Application status and recent submissions
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {admissionCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-border bg-background px-4 py-5"
            >
              <p className="text-sm text-muted">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold">Recent applications</h4>
            <Link href="/admin/admissions/new" className="text-sm text-brand">
              Create admission
            </Link>
          </div>

          <RecentApplicationsTable rows={stats.recentApplications} />
        </div>
      </section>
    </div>
  );
}
