import { createClient } from "@/lib/supabase/server";
import { listActiveClasses } from "./classes";

const TERM_SELECT = `
  id, name, academic_year_id, class_id, section_id, start_date, end_date, is_locked,
  class:classes(name),
  section:sections(name)
`;

export type ExamTermRecord = {
  id: string;
  name: string;
  academic_year_id: string;
  class_id: string | null;
  section_id: string | null;
  class_name: string | null;
  section_name: string | null;
  start_date: string | null;
  end_date: string | null;
  is_locked: boolean;
};

export type ExamSubjectRecord = {
  id: string;
  exam_term_id: string;
  subject_id: string;
  subject_name: string;
  class_id: string;
  class_name: string;
  max_marks: number;
  pass_marks: number;
};

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function mapTerm(row: Record<string, unknown>): ExamTermRecord {
  const klass = Array.isArray(row.class) ? row.class[0] : row.class;
  const section = Array.isArray(row.section) ? row.section[0] : row.section;
  return {
    id: row.id as string,
    name: row.name as string,
    academic_year_id: row.academic_year_id as string,
    class_id: (row.class_id as string | null) ?? null,
    section_id: (row.section_id as string | null) ?? null,
    class_name:
      (klass as { name?: string } | null)?.name ?? null,
    section_name:
      (section as { name?: string } | null)?.name ?? null,
    start_date: (row.start_date as string | null) ?? null,
    end_date: (row.end_date as string | null) ?? null,
    is_locked: Boolean(row.is_locked),
  };
}

export async function listExamTerms(
  schoolId: string,
  academicYearId: string,
): Promise<ExamTermRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_terms")
    .select(TERM_SELECT)
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId)
    .order("start_date", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapTerm(row as Record<string, unknown>));
}

export async function getExamTerm(
  schoolId: string,
  termId: string,
): Promise<ExamTermRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_terms")
    .select(TERM_SELECT)
    .eq("school_id", schoolId)
    .eq("id", termId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapTerm(data as Record<string, unknown>) : null;
}

export async function createExamTerm(input: {
  schoolId: string;
  academicYearId: string;
  name: string;
  classId: string;
  sectionId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<ExamTermRecord> {
  const name = input.name.trim();
  if (!name) throw new Error("Exam name is required.");
  if (!input.classId || input.classId === "ALL") {
    throw new Error("Class is required.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_terms")
    .insert({
      school_id: input.schoolId,
      academic_year_id: input.academicYearId,
      name,
      class_id: input.classId,
      section_id: input.sectionId || null,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
    })
    .select(TERM_SELECT)
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error(
        "An exam with this name already exists for this class/section.",
      );
    }
    throw new Error(error?.message || "Could not create exam.");
  }
  return mapTerm(data as Record<string, unknown>);
}

/** Create the same exam for every active class (all sections). */
export async function createExamTermForAllClasses(input: {
  schoolId: string;
  academicYearId: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<{ created: number; skipped: number }> {
  const name = input.name.trim();
  if (!name) throw new Error("Exam name is required.");

  const classes = await listActiveClasses(input.schoolId);
  if (!classes.length) throw new Error("No active classes found.");

  let created = 0;
  let skipped = 0;

  for (const klass of classes) {
    try {
      await createExamTerm({
        schoolId: input.schoolId,
        academicYearId: input.academicYearId,
        name,
        classId: klass.id,
        sectionId: null,
        startDate: input.startDate,
        endDate: input.endDate,
      });
      created += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("already exists")) {
        skipped += 1;
        continue;
      }
      throw error;
    }
  }

  if (created === 0 && skipped > 0) {
    throw new Error(
      "This exam already exists for every class. Nothing new was created.",
    );
  }

  return { created, skipped };
}

export async function updateExamTerm(input: {
  schoolId: string;
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  isLocked?: boolean;
}): Promise<ExamTermRecord> {
  const name = input.name.trim();
  if (!name) throw new Error("Exam name is required.");

  const supabase = await createClient();
  const payload: Record<string, unknown> = {
    name,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    updated_at: new Date().toISOString(),
  };
  if (typeof input.isLocked === "boolean") {
    payload.is_locked = input.isLocked;
  }

  const { data, error } = await supabase
    .from("exam_terms")
    .update(payload)
    .eq("id", input.id)
    .eq("school_id", input.schoolId)
    .select(TERM_SELECT)
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error(
        "An exam with this name already exists for this class/section.",
      );
    }
    throw new Error(error?.message || "Could not update exam.");
  }
  return mapTerm(data as Record<string, unknown>);
}

export async function setExamTermLocked(input: {
  schoolId: string;
  id: string;
  isLocked: boolean;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exam_terms")
    .update({
      is_locked: input.isLocked,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("school_id", input.schoolId);

  if (error) throw new Error(error.message);
}

export async function listExamSubjects(
  schoolId: string,
  examTermId: string,
  classId?: string | null,
): Promise<ExamSubjectRecord[]> {
  const supabase = await createClient();
  let query = supabase
    .from("exam_subjects")
    .select(
      `
      id, exam_term_id, subject_id, class_id, max_marks, pass_marks,
      subject:subjects(name),
      class:classes(name)
    `,
    )
    .eq("school_id", schoolId)
    .eq("exam_term_id", examTermId);

  if (classId) query = query.eq("class_id", classId);

  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;
    const klass = Array.isArray(row.class) ? row.class[0] : row.class;
    return {
      id: row.id as string,
      exam_term_id: row.exam_term_id as string,
      subject_id: row.subject_id as string,
      subject_name: subject?.name ?? "Subject",
      class_id: row.class_id as string,
      class_name: klass?.name ?? "Class",
      max_marks: toNumber(row.max_marks),
      pass_marks: toNumber(row.pass_marks),
    };
  });
}

export async function upsertExamSubject(input: {
  schoolId: string;
  examTermId: string;
  subjectId: string;
  classId: string;
  maxMarks: number;
  passMarks: number;
  id?: string | null;
}): Promise<ExamSubjectRecord> {
  if (!input.subjectId) throw new Error("Subject is required.");
  if (!input.classId) throw new Error("Class is required.");
  if (!(input.maxMarks > 0)) throw new Error("Max marks must be greater than 0.");
  if (input.passMarks < 0 || input.passMarks > input.maxMarks) {
    throw new Error("Pass marks must be between 0 and max marks.");
  }

  const term = await getExamTerm(input.schoolId, input.examTermId);
  if (!term) throw new Error("Exam not found.");
  if (term.is_locked) throw new Error("This exam is locked.");
  if (term.class_id && term.class_id !== input.classId) {
    throw new Error("Subject class must match the exam class.");
  }

  const supabase = await createClient();
  const payload = {
    school_id: input.schoolId,
    exam_term_id: input.examTermId,
    subject_id: input.subjectId,
    class_id: input.classId,
    max_marks: input.maxMarks,
    pass_marks: input.passMarks,
    updated_at: new Date().toISOString(),
  };

  const query = input.id
    ? supabase
        .from("exam_subjects")
        .update(payload)
        .eq("id", input.id)
        .eq("school_id", input.schoolId)
    : supabase.from("exam_subjects").insert(payload);

  const { data, error } = await query
    .select(
      `
      id, exam_term_id, subject_id, class_id, max_marks, pass_marks,
      subject:subjects(name),
      class:classes(name)
    `,
    )
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("This subject is already added for the class.");
    }
    throw new Error(error?.message || "Could not save exam subject.");
  }

  const subject = Array.isArray(data.subject) ? data.subject[0] : data.subject;
  const klass = Array.isArray(data.class) ? data.class[0] : data.class;
  return {
    id: data.id as string,
    exam_term_id: data.exam_term_id as string,
    subject_id: data.subject_id as string,
    subject_name: subject?.name ?? "Subject",
    class_id: data.class_id as string,
    class_name: klass?.name ?? "Class",
    max_marks: toNumber(data.max_marks),
    pass_marks: toNumber(data.pass_marks),
  };
}

export async function deleteExamSubject(
  schoolId: string,
  examSubjectId: string,
): Promise<void> {
  const supabase = await createClient();
  const { data: row, error: fetchError } = await supabase
    .from("exam_subjects")
    .select("exam_term_id")
    .eq("id", examSubjectId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!row) throw new Error("Exam subject not found.");

  const term = await getExamTerm(schoolId, row.exam_term_id);
  if (term?.is_locked) throw new Error("This exam is locked.");

  const { error } = await supabase
    .from("exam_subjects")
    .delete()
    .eq("id", examSubjectId)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);
}
