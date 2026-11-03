import { requireAdmin } from "@/lib/auth";
import { ensureAdmissionYearOptions } from "@/lib/data/academic-years";
import { listSectionRows } from "@/lib/data/classes";
import { ClassSettingsTable } from "./class-settings-table";

export default async function ClassSettingsPage() {
  const profile = await requireAdmin();
  const years = await ensureAdmissionYearOptions(profile.school_id);
  const year = years.find((item) => item.is_current) ?? years[0];
  const rows = await listSectionRows(profile.school_id);

  if (!year) {
    return (
      <div>
        <h2 className="display-font text-3xl">Class settings</h2>
        <p className="mt-2 text-sm text-muted">
          No current academic year found. Finish first-time setup first.
        </p>
      </div>
    );
  }

  return (
    <ClassSettingsTable
      rows={rows}
      academicYearId={year.id}
      yearName={year.name}
    />
  );
}
