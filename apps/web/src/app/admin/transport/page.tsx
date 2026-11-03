import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getTransportOverview } from "@/lib/data/transport";

export default async function TransportOverviewPage() {
  const profile = await requireAdmin();
  const overview = await getTransportOverview(profile.school_id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="display-font text-3xl">Transport</h2>
        <p className="mt-1 text-sm text-muted">
          Routes, stops, and student bus assignments
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Active routes</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {overview.routes}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Stops</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {overview.stops}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Students using transport</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-brand">
            {overview.riders}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/transport/routes"
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-card"
        >
          Manage routes & stops
        </Link>
        <Link
          href="/admin/transport/students"
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-card"
        >
          Assign students
        </Link>
      </div>
    </div>
  );
}
