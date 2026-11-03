import { requireAdmin } from "@/lib/auth";
import {
  currentPeriodLabel,
  listPayrollRows,
} from "@/lib/data/employees";
import { PayrollClient } from "./payroll-client";

export default async function EmployeePayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const profile = await requireAdmin();
  const params = await searchParams;
  const period = params.period || currentPeriodLabel();
  const payroll = await listPayrollRows(profile.school_id, period);

  return (
    <PayrollClient
      periodLabel={payroll.periodLabel}
      rows={payroll.rows}
    />
  );
}
