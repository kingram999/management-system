import { requireAdmin } from "@/lib/auth";
import { listSubjects } from "@/lib/data/subjects";
import { ExaminationSettingsClient } from "./examination-settings-client";

export default async function ExaminationSettingsPage() {
  const profile = await requireAdmin();
  const subjects = await listSubjects(profile.school_id);
  return <ExaminationSettingsClient subjects={subjects} />;
}
