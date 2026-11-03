import { requireAdmin } from "@/lib/auth";
import { formatInr } from "@/lib/class-levels";
import { getFeeOverview } from "@/lib/data/fees";
import { FeeOverviewTable } from "./fee-overview-table";

export default async function FeesOverviewPage() {
  const profile = await requireAdmin();
  const overview = await getFeeOverview(profile.school_id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="display-font text-3xl">Fee overview</h2>
        <p className="mt-1 text-sm text-muted">
          Annual fee totals for active students
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Total billed</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatInr(overview.billed)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Collected</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-brand">
            {formatInr(overview.collected)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Pending</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatInr(overview.pending)}
          </p>
        </div>
      </div>

      <FeeOverviewTable rows={overview.byClass} />
    </div>
  );
}
