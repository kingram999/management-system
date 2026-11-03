import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ensureAdmissionYearOptions } from "@/lib/data/academic-years";
import { createClient } from "@/lib/supabase/server";
import { NewAdmissionForm } from "./new-admission-form";

export default async function NewAdmissionPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const years = await ensureAdmissionYearOptions(profile.school_id);
  const currentYear = years.find((y) => y.is_current) ?? years[0];

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, academic_year_id, annual_fee, numeric_level")
    .eq("school_id", profile.school_id)
    .is("deleted_at", null)
    .order("numeric_level", { ascending: true });

  // Prefer classes for the current admission year; fall back to any active classes
  const yearClasses =
    (classes ?? []).filter((item) => item.academic_year_id === currentYear?.id) ??
    [];
  const classOptions =
    yearClasses.length > 0 ? yearClasses : (classes ?? []);

  return (
    <div>
      <h2 className="display-font text-3xl">Create Admission</h2>
      <p className="mt-1 text-sm text-muted">
        Fill student, guardian, and fee details for a new admission
      </p>

      {classOptions.length === 0 ? (
        <div className="mt-8 rounded-xl border border-warning/30 bg-amber-50 px-4 py-4 text-sm text-warning">
          Add at least one class in{" "}
          <Link
            href="/admin/settings/classes"
            className="font-semibold underline"
          >
            Class settings
          </Link>{" "}
          before creating applications.
        </div>
      ) : (
        <div className="mt-8">
          <NewAdmissionForm
            years={years}
            classes={classOptions}
            defaultYearId={currentYear?.id}
          />
        </div>
      )}
    </div>
  );
}
