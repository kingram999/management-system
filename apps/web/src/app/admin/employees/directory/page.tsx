import { requireAdmin } from "@/lib/auth";
import { listEmployees } from "@/lib/data/employees";
import { EmployeeDirectoryClient } from "./directory-client";

export default async function EmployeeDirectoryPage() {
  const profile = await requireAdmin();
  const employees = await listEmployees(profile.school_id);
  return <EmployeeDirectoryClient employees={employees} />;
}
