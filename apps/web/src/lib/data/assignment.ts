import {
  assignStudentsToSections,
  assertRuleSupported,
  isAssignmentRule,
  sortStudentsByRule,
  type AssignmentRule,
  type AssignableStudent,
} from "@/lib/assignment-rules";
import { createClient } from "@/lib/supabase/server";
import { getSchoolById } from "./school";

type EnrollmentRow = {
  id: string;
  student_id: string;
  class_id: string;
  section_id: string | null;
  roll_number: string | null;
  academic_year: { is_current: boolean } | { is_current: boolean }[] | null;
};

function isCurrentEnrollment(row: EnrollmentRow) {
  const year = Array.isArray(row.academic_year)
    ? row.academic_year[0]
    : row.academic_year;
  return Boolean(year?.is_current);
}

async function loadAssignableStudents(
  schoolId: string,
  studentIds: string[],
): Promise<{
  students: AssignableStudent[];
  enrollmentsByStudent: Map<string, EnrollmentRow>;
}> {
  if (!studentIds.length) {
    return { students: [], enrollmentsByStudent: new Map() };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id, first_name, last_name, gender, date_of_birth, school_id,
      enrollments:student_enrollments(
        id, student_id, class_id, section_id, roll_number,
        academic_year:academic_years(is_current)
      )
    `,
    )
    .eq("school_id", schoolId)
    .in("id", studentIds);

  if (error) throw new Error(error.message);

  const students: AssignableStudent[] = [];
  const enrollmentsByStudent = new Map<string, EnrollmentRow>();

  for (const row of data ?? []) {
    students.push({
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      gender: row.gender,
      date_of_birth: row.date_of_birth,
    });

    const enrollments = (row.enrollments ?? []) as EnrollmentRow[];
    const current =
      enrollments.find(isCurrentEnrollment) ?? enrollments[0] ?? null;
    if (current) enrollmentsByStudent.set(row.id, current);
  }

  return { students, enrollmentsByStudent };
}

async function listSectionIdsForClass(classId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sections")
    .select("id, name")
    .eq("class_id", classId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((section) => section.id);
}

export async function assignSections(input: {
  schoolId: string;
  classId: string;
  studentIds: string[];
  mode: "SETTINGS" | "MANUAL";
  sectionId?: string | null;
}): Promise<{ updated: number }> {
  const uniqueIds = Array.from(new Set(input.studentIds));
  if (!uniqueIds.length) throw new Error("Select at least one student.");
  if (!input.classId) throw new Error("Choose a class before assigning sections.");

  const { students, enrollmentsByStudent } = await loadAssignableStudents(
    input.schoolId,
    uniqueIds,
  );

  if (students.length !== uniqueIds.length) {
    throw new Error("Some selected students were not found.");
  }

  for (const student of students) {
    const enrollment = enrollmentsByStudent.get(student.id);
    if (!enrollment) {
      throw new Error(
        `${student.first_name} ${student.last_name} has no current enrollment.`,
      );
    }
    if (enrollment.class_id !== input.classId) {
      throw new Error(
        "All selected students must belong to the filtered class.",
      );
    }
  }

  const sectionIds = await listSectionIdsForClass(input.classId);
  if (!sectionIds.length) {
    throw new Error("This class has no sections.");
  }

  let assignments: Map<string, string>;

  if (input.mode === "MANUAL") {
    if (!input.sectionId || !sectionIds.includes(input.sectionId)) {
      throw new Error("Choose a valid target section.");
    }
    assignments = new Map(uniqueIds.map((id) => [id, input.sectionId!]));
  } else {
    const school = await getSchoolById(input.schoolId);
    const ruleRaw = school.section_assignment_rule;
    if (!isAssignmentRule(ruleRaw)) {
      throw new Error("Invalid section assignment rule in settings.");
    }
    assignments = assignStudentsToSections(students, sectionIds, ruleRaw);
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  let updated = 0;

  for (const student of students) {
    const enrollment = enrollmentsByStudent.get(student.id)!;
    const sectionId = assignments.get(student.id);
    if (!sectionId) continue;

    const { error } = await supabase
      .from("student_enrollments")
      .update({
        section_id: sectionId,
        updated_at: now,
      })
      .eq("id", enrollment.id);

    if (error) throw new Error(error.message);
    updated += 1;
  }

  return { updated };
}

export async function assignRollNumbers(input: {
  schoolId: string;
  studentIds: string[];
}): Promise<{ updated: number; skipped: number }> {
  const uniqueIds = Array.from(new Set(input.studentIds));
  if (!uniqueIds.length) throw new Error("Select at least one student.");

  const school = await getSchoolById(input.schoolId);
  const ruleRaw = school.roll_number_assignment_rule;
  if (!isAssignmentRule(ruleRaw)) {
    throw new Error("Invalid roll number assignment rule in settings.");
  }
  const rule: AssignmentRule = ruleRaw;
  assertRuleSupported(rule);

  const { students, enrollmentsByStudent } = await loadAssignableStudents(
    input.schoolId,
    uniqueIds,
  );

  if (students.length !== uniqueIds.length) {
    throw new Error("Some selected students were not found.");
  }

  const bySection = new Map<string, AssignableStudent[]>();
  let skipped = 0;

  for (const student of students) {
    const enrollment = enrollmentsByStudent.get(student.id);
    if (!enrollment?.section_id) {
      skipped += 1;
      continue;
    }
    const list = bySection.get(enrollment.section_id) ?? [];
    list.push(student);
    bySection.set(enrollment.section_id, list);
  }

  if (bySection.size === 0) {
    throw new Error(
      "None of the selected students have a section. Assign sections first.",
    );
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  let updated = 0;

  for (const [, sectionStudents] of bySection) {
    const ordered = sortStudentsByRule(sectionStudents, rule);
    for (let index = 0; index < ordered.length; index += 1) {
      const student = ordered[index];
      const enrollment = enrollmentsByStudent.get(student.id)!;
      const { error } = await supabase
        .from("student_enrollments")
        .update({
          roll_number: String(index + 1),
          updated_at: now,
        })
        .eq("id", enrollment.id);

      if (error) throw new Error(error.message);
      updated += 1;
    }
  }

  return { updated, skipped };
}
