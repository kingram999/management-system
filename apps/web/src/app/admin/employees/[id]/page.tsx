import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  getEmployee,
  listSalaryPaymentsForEmployee,
} from "@/lib/data/employees";
import { EmployeeProfileClient } from "./employee-profile-client";

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireAdmin();
  const [employee, payments] = await Promise.all([
    getEmployee(profile.school_id, id),
    listSalaryPaymentsForEmployee(profile.school_id, id),
  ]);

  if (!employee) notFound();

  return (
    <div>
      <Link href="/admin/employees/directory" className="text-sm text-brand">
        ← Back to directory
      </Link>
      <EmployeeProfileClient employee={employee} payments={payments} />
    </div>
  );
}
