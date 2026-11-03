import { admissionYearWindow } from "@/lib/academic-years";
import { createClient } from "@/lib/supabase/server";

export type AcademicYearOption = {
  id: string;
  name: string;
  is_current: boolean;
  start_date: string;
};

/** Ensure 2026-27 … 2031-32 exist; mark 2026-27 current. Return those years in order. */
export async function ensureAdmissionYearOptions(
  schoolId: string,
): Promise<AcademicYearOption[]> {
  const supabase = await createClient();
  const window = admissionYearWindow();

  const { data: existing, error } = await supabase
    .from("academic_years")
    .select("id, name, is_current, start_date")
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);

  const byName = new Map((existing ?? []).map((year) => [year.name, year]));
  const missing = window.filter((year) => !byName.has(year.name));

  if (missing.length > 0) {
    const { data: created, error: insertError } = await supabase
      .from("academic_years")
      .insert(
        missing.map((year) => ({
          school_id: schoolId,
          name: year.name,
          start_date: year.startDate,
          end_date: year.endDate,
          is_current: false,
        })),
      )
      .select("id, name, is_current, start_date");

    if (insertError) throw new Error(insertError.message);
    for (const year of created ?? []) {
      byName.set(year.name, year);
    }
  }

  // Mark 2026-27 as the current year for admissions defaults
  const currentLabel = window[0]?.name;
  if (currentLabel) {
    await supabase
      .from("academic_years")
      .update({ is_current: false })
      .eq("school_id", schoolId)
      .neq("name", currentLabel);

    await supabase
      .from("academic_years")
      .update({ is_current: true })
      .eq("school_id", schoolId)
      .eq("name", currentLabel);
  }

  // If 2026-27 has no classes but an older year does, reassign those classes
  const currentYear = byName.get(currentLabel);
  if (currentYear) {
    const { count: currentClassCount } = await supabase
      .from("classes")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("academic_year_id", currentYear.id)
      .is("deleted_at", null);

    if ((currentClassCount ?? 0) === 0) {
      const donor = (existing ?? [])
        .filter((year) => year.name !== currentLabel)
        .sort((a, b) => b.start_date.localeCompare(a.start_date))[0];

      if (donor) {
        await supabase
          .from("classes")
          .update({
            academic_year_id: currentYear.id,
            updated_at: new Date().toISOString(),
          })
          .eq("school_id", schoolId)
          .eq("academic_year_id", donor.id)
          .is("deleted_at", null);
      }
    }
  }

  return window
    .map((year) => {
      const row = byName.get(year.name);
      if (!row) return null;
      return {
        id: row.id,
        name: year.name,
        is_current: year.isCurrent,
        start_date: year.startDate,
      };
    })
    .filter((year): year is AcademicYearOption => year !== null);
}

/**
 * Resolve a class in the target academic year.
 * If the selected class belongs to another year, find or clone it into the target year.
 */
export async function resolveClassForYear(input: {
  schoolId: string;
  sourceClassId: string;
  targetAcademicYearId: string;
}) {
  const supabase = await createClient();

  const { data: source, error } = await supabase
    .from("classes")
    .select("id, name, numeric_level, annual_fee, academic_year_id")
    .eq("id", input.sourceClassId)
    .eq("school_id", input.schoolId)
    .is("deleted_at", null)
    .single();

  if (error || !source) {
    throw new Error(error?.message || "Class not found.");
  }

  if (source.academic_year_id === input.targetAcademicYearId) {
    return source;
  }

  const { data: existing } = await supabase
    .from("classes")
    .select("id, name, numeric_level, annual_fee, academic_year_id")
    .eq("school_id", input.schoolId)
    .eq("academic_year_id", input.targetAcademicYearId)
    .eq("name", source.name)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error: createError } = await supabase
    .from("classes")
    .insert({
      school_id: input.schoolId,
      academic_year_id: input.targetAcademicYearId,
      name: source.name,
      numeric_level: source.numeric_level,
      annual_fee: source.annual_fee,
    })
    .select("id, name, numeric_level, annual_fee, academic_year_id")
    .single();

  if (createError || !created) {
    throw new Error(createError?.message || "Could not prepare class for year.");
  }

  // Copy active sections from source class
  const { data: sections } = await supabase
    .from("sections")
    .select("name, capacity, head_teacher_name")
    .eq("class_id", source.id)
    .is("deleted_at", null);

  if (sections && sections.length > 0) {
    await supabase.from("sections").insert(
      sections.map((section) => ({
        class_id: created.id,
        name: section.name,
        capacity: section.capacity,
        head_teacher_name: section.head_teacher_name,
      })),
    );
  }

  return created;
}
