import { requireAdmin } from "@/lib/auth";
import { ensureAdmissionYearOptions } from "@/lib/data/academic-years";
import { listActiveClasses } from "@/lib/data/classes";
import { AddStudentsClient } from "./add-students-client";

export default async function AddStudentsPage() {
  const profile = await requireAdmin();
  const [years, classes] = await Promise.all([
    ensureAdmissionYearOptions(profile.school_id),
    listActiveClasses(profile.school_id),
  ]);

  const currentYear = years.find((y) => y.is_current) ?? years[0];
  const classOptions = classes.map((item) => ({
    id: item.id,
    name: item.name,
    academic_year_id: item.academic_year_id,
    annual_fee: item.annual_fee,
    sections: item.sections.map((section) => ({
      id: section.id,
      name: section.name,
    })),
  }));

  return (
    <AddStudentsClient
      years={years}
      classes={classOptions}
      defaultYearId={currentYear?.id}
      schoolId={profile.school_id}
      profileId={profile.id}
    />
  );
}
