import { requireAdmin } from "@/lib/auth";
import { listEmployeeAttendanceSheet } from "@/lib/data/employees";
import { EmployeeAttendanceClient } from "./attendance-client";

export default async function EmployeeAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const profile = await requireAdmin();
  const params = await searchParams;
  const date =
    params.date || new Date().toISOString().slice(0, 10);
  const sheet = await listEmployeeAttendanceSheet({
    schoolId: profile.school_id,
    date,
  });

  return (
    <EmployeeAttendanceClient
      initialDate={sheet.date}
      initialRows={sheet.rows}
      lastMarkedByName={sheet.lastMarkedByName}
    />
  );
}
