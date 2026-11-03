import { defaultAnnualFee } from "@/lib/class-levels";
import { createClient } from "@/lib/supabase/server";
import type { ClassRecord, SectionRow } from "./types";

export async function listActiveClasses(schoolId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select(
      "id, name, numeric_level, academic_year_id, annual_fee, sections(id, name, head_teacher_name, deleted_at)",
    )
    .eq("school_id", schoolId)
    .is("deleted_at", null)
    .order("numeric_level", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((item) => ({
    ...item,
    sections: (item.sections ?? []).filter(
      (section: { deleted_at: string | null }) => !section.deleted_at,
    ),
  })) as ClassRecord[];
}

export async function listSectionRows(schoolId: string): Promise<SectionRow[]> {
  const classes = await listActiveClasses(schoolId);
  const rows: SectionRow[] = [];

  for (const schoolClass of classes) {
    for (const section of schoolClass.sections) {
      rows.push({
        sectionId: section.id,
        sectionName: section.name,
        headTeacherName: section.head_teacher_name ?? null,
        classId: schoolClass.id,
        className: schoolClass.name,
        numericLevel: schoolClass.numeric_level,
        annualFee: schoolClass.annual_fee,
      });
    }
  }

  return rows.sort((a, b) => {
    if (a.numericLevel !== b.numericLevel) {
      return a.numericLevel - b.numericLevel;
    }
    const classCmp = a.className.localeCompare(b.className);
    if (classCmp !== 0) return classCmp;
    return a.sectionName.localeCompare(b.sectionName);
  });
}

export async function createClassOrSection(input: {
  schoolId: string;
  academicYearId: string;
  className: string;
  numericLevel: number;
  sectionName: string;
  headTeacherName?: string | null;
}) {
  const supabase = await createClient();
  const className = input.className.trim();
  const sectionName = input.sectionName.trim();
  const headTeacher = input.headTeacherName?.trim() || null;

  if (!className || !sectionName) {
    throw new Error("Class name and section name are required.");
  }

  let classId: string;

  const { data: existing } = await supabase
    .from("classes")
    .select("id")
    .eq("school_id", input.schoolId)
    .eq("academic_year_id", input.academicYearId)
    .eq("name", className)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    classId = existing.id;
  } else {
    const { data: created, error } = await supabase
      .from("classes")
      .insert({
        school_id: input.schoolId,
        academic_year_id: input.academicYearId,
        name: className,
        numeric_level: input.numericLevel,
        annual_fee: defaultAnnualFee(input.numericLevel),
      })
      .select("id")
      .single();

    if (error || !created) {
      throw new Error(error?.message || "Could not create class.");
    }
    classId = created.id;
  }

  const { data: existingSection } = await supabase
    .from("sections")
    .select("id")
    .eq("class_id", classId)
    .eq("name", sectionName)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingSection) {
    throw new Error("That section already exists for this class.");
  }

  const { error: sectionError } = await supabase.from("sections").insert({
    class_id: classId,
    name: sectionName,
    head_teacher_name: headTeacher,
  });

  if (sectionError) throw new Error(sectionError.message);

  return classId;
}

export async function updateClassDetails(
  schoolId: string,
  classId: string,
  input: { name: string; annualFee: number },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .update({
      name: input.name,
      annual_fee: input.annualFee,
      updated_at: new Date().toISOString(),
    })
    .eq("id", classId)
    .eq("school_id", schoolId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
}

export async function updateClassAnnualFee(
  schoolId: string,
  classId: string,
  annualFee: number,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .update({
      annual_fee: annualFee,
      updated_at: new Date().toISOString(),
    })
    .eq("id", classId)
    .eq("school_id", schoolId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
}

export async function updateSectionRow(
  schoolId: string,
  input: {
    sectionId: string;
    classId: string;
    className: string;
    sectionName: string;
    headTeacherName: string | null;
    annualFee: number;
  },
) {
  await updateClassDetails(schoolId, input.classId, {
    name: input.className.trim(),
    annualFee: input.annualFee,
  });

  const supabase = await createClient();
  const { data: section } = await supabase
    .from("sections")
    .select("id, class:classes!inner(school_id)")
    .eq("id", input.sectionId)
    .is("deleted_at", null)
    .single();

  const related = section?.class as
    | { school_id: string }
    | { school_id: string }[]
    | undefined;
  const schoolFromClass = Array.isArray(related)
    ? related[0]?.school_id
    : related?.school_id;

  if (!section || schoolFromClass !== schoolId) {
    throw new Error("Section not found.");
  }

  const { error } = await supabase
    .from("sections")
    .update({
      name: input.sectionName.trim(),
      head_teacher_name: input.headTeacherName?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.sectionId);

  if (error) throw new Error(error.message);
}

export async function softDeleteSection(schoolId: string, sectionId: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: section } = await supabase
    .from("sections")
    .select("id, class_id, class:classes!inner(school_id)")
    .eq("id", sectionId)
    .is("deleted_at", null)
    .single();

  const related = section?.class as
    | { school_id: string }
    | { school_id: string }[]
    | undefined;
  const schoolFromClass = Array.isArray(related)
    ? related[0]?.school_id
    : related?.school_id;

  if (!section || schoolFromClass !== schoolId) {
    throw new Error("Section not found.");
  }

  const { error } = await supabase
    .from("sections")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", sectionId);

  if (error) throw new Error(error.message);

  const { count } = await supabase
    .from("sections")
    .select("*", { count: "exact", head: true })
    .eq("class_id", section.class_id)
    .is("deleted_at", null);

  if ((count ?? 0) === 0) {
    await supabase
      .from("classes")
      .update({ deleted_at: now, updated_at: now })
      .eq("id", section.class_id)
      .eq("school_id", schoolId);
  }
}

export async function softDeleteClass(schoolId: string, classId: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("classes")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", classId)
    .eq("school_id", schoolId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  await supabase
    .from("sections")
    .update({ deleted_at: now, updated_at: now })
    .eq("class_id", classId)
    .is("deleted_at", null);
}
