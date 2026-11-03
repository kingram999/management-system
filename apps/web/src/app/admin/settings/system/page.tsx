import { requireAdmin } from "@/lib/auth";
import { getSchoolById } from "@/lib/data/school";
import { SchoolForm } from "../school-form";

export default async function SystemSettingsPage() {
  const profile = await requireAdmin();
  const school = await getSchoolById(profile.school_id);

  return <SchoolForm school={school} />;
}
