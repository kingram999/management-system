import { roundToHalf } from "@/lib/marks-utils";
import { createClient } from "@/lib/supabase/server";
import { listExamSubjects } from "./exams";
import { listStudentsForDirectory } from "./students";

export type MarksSheetRow = {
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  sectionId: string | null;
  marksObtained: number | null;
  isAbsent: boolean;
  existing: boolean;
};

export type MarksSheet = {
  examSubjectId: string;
  maxMarks: number;
  passMarks: number;
  isLocked: boolean;
  subjectName: string;
  rows: MarksSheetRow[];
};

export type ResultSubjectColumn = {
  examSubjectId: string;
  subjectId: string;
  subjectName: string;
  maxMarks: number;
  passMarks: number;
};

export type ResultStudentRow = {
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  sectionName: string | null;
  scores: Record<
    string,
    { marksObtained: number | null; isAbsent: boolean; passed: boolean | null }
  >;
  totalObtained: number;
  totalMax: number;
  percentage: number | null;
  passed: boolean;
  complete: boolean;
};

export async function listMarksSheet(input: {
  schoolId: string;
  examTermId: string;
  classId: string;
  sectionId?: string | null;
  subjectId: string;
}): Promise<MarksSheet | null> {
  if (!input.examTermId || !input.classId || !input.subjectId) return null;

  const supabase = await createClient();
  const { data: examSubject, error } = await supabase
    .from("exam_subjects")
    .select(
      `
      id, max_marks, pass_marks,
      subject:subjects(name),
      exam_term:exam_terms(is_locked)
    `,
    )
    .eq("school_id", input.schoolId)
    .eq("exam_term_id", input.examTermId)
    .eq("class_id", input.classId)
    .eq("subject_id", input.subjectId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!examSubject) return null;

  const subject = Array.isArray(examSubject.subject)
    ? examSubject.subject[0]
    : examSubject.subject;
  const term = Array.isArray(examSubject.exam_term)
    ? examSubject.exam_term[0]
    : examSubject.exam_term;

  const students = (await listStudentsForDirectory(input.schoolId)).filter(
    (student) => {
      if (student.class_id !== input.classId) return false;
      if (input.sectionId && student.section_id !== input.sectionId) {
        return false;
      }
      return student.status === "ACTIVE";
    },
  );

  students.sort((a, b) => {
    const rollCmp = (a.roll_number || "").localeCompare(b.roll_number || "", undefined, {
      numeric: true,
    });
    if (rollCmp !== 0) return rollCmp;
    return `${a.last_name} ${a.first_name}`.localeCompare(
      `${b.last_name} ${b.first_name}`,
    );
  });

  const studentIds = students.map((s) => s.id);
  const existing = new Map<
    string,
    { marksObtained: number | null; isAbsent: boolean }
  >();

  if (studentIds.length) {
    const { data: marks, error: marksError } = await supabase
      .from("exam_marks")
      .select("student_id, marks_obtained, is_absent")
      .eq("school_id", input.schoolId)
      .eq("exam_subject_id", examSubject.id)
      .in("student_id", studentIds);

    if (marksError) throw new Error(marksError.message);
    for (const row of marks ?? []) {
      existing.set(row.student_id, {
        marksObtained:
          row.marks_obtained == null ? null : Number(row.marks_obtained),
        isAbsent: Boolean(row.is_absent),
      });
    }
  }

  return {
    examSubjectId: examSubject.id as string,
    maxMarks: Number(examSubject.max_marks),
    passMarks: Number(examSubject.pass_marks),
    isLocked: Boolean(term?.is_locked),
    subjectName: subject?.name ?? "Subject",
    rows: students.map((student) => {
      const mark = existing.get(student.id);
      return {
        studentId: student.id,
        admissionNumber: student.admission_number,
        firstName: student.first_name,
        lastName: student.last_name,
        rollNumber: student.roll_number,
        sectionId: student.section_id,
        marksObtained: mark?.marksObtained ?? null,
        isAbsent: mark?.isAbsent ?? false,
        existing: Boolean(mark),
      };
    }),
  };
}

export async function saveMarksSheet(input: {
  schoolId: string;
  enteredById: string;
  examSubjectId: string;
  marks: Array<{
    studentId: string;
    sectionId?: string | null;
    marksObtained: number | null;
    isAbsent: boolean;
  }>;
}): Promise<{ saved: number }> {
  const supabase = await createClient();
  const { data: examSubject, error } = await supabase
    .from("exam_subjects")
    .select("id, max_marks, school_id, exam_term:exam_terms(is_locked)")
    .eq("id", input.examSubjectId)
    .eq("school_id", input.schoolId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!examSubject) throw new Error("Exam subject not found.");

  const term = Array.isArray(examSubject.exam_term)
    ? examSubject.exam_term[0]
    : examSubject.exam_term;
  if (term?.is_locked) throw new Error("This exam is locked.");

  const maxMarks = Number(examSubject.max_marks);
  const now = new Date().toISOString();
  const rows = input.marks.map((mark) => {
    if (mark.isAbsent) {
      return {
        school_id: input.schoolId,
        exam_subject_id: input.examSubjectId,
        student_id: mark.studentId,
        section_id: mark.sectionId || null,
        marks_obtained: null,
        is_absent: true,
        entered_by_id: input.enteredById,
        updated_at: now,
      };
    }
    if (mark.marksObtained == null || Number.isNaN(mark.marksObtained)) {
      throw new Error("Marks are required unless the student is marked absent.");
    }
    const rounded = roundToHalf(mark.marksObtained);
    if (rounded < 0 || rounded > maxMarks) {
      throw new Error(`Marks must be between 0 and ${maxMarks}.`);
    }
    return {
      school_id: input.schoolId,
      exam_subject_id: input.examSubjectId,
      student_id: mark.studentId,
      section_id: mark.sectionId || null,
      marks_obtained: rounded,
      is_absent: false,
      entered_by_id: input.enteredById,
      updated_at: now,
    };
  });

  if (!rows.length) return { saved: 0 };

  const { error: upsertError } = await supabase.from("exam_marks").upsert(rows, {
    onConflict: "exam_subject_id,student_id",
  });

  if (upsertError) throw new Error(upsertError.message);
  return { saved: rows.length };
}

export async function listExamResults(input: {
  schoolId: string;
  examTermId: string;
  classId: string;
  sectionId?: string | null;
}): Promise<{
  subjects: ResultSubjectColumn[];
  rows: ResultStudentRow[];
}> {
  if (!input.examTermId || !input.classId) {
    return { subjects: [], rows: [] };
  }

  const subjects = await listExamSubjects(
    input.schoolId,
    input.examTermId,
    input.classId,
  );

  const students = (await listStudentsForDirectory(input.schoolId)).filter(
    (student) => {
      if (student.class_id !== input.classId) return false;
      if (input.sectionId && student.section_id !== input.sectionId) {
        return false;
      }
      return student.status === "ACTIVE";
    },
  );

  students.sort((a, b) => {
    const rollCmp = (a.roll_number || "").localeCompare(b.roll_number || "", undefined, {
      numeric: true,
    });
    if (rollCmp !== 0) return rollCmp;
    return `${a.last_name} ${a.first_name}`.localeCompare(
      `${b.last_name} ${b.first_name}`,
    );
  });

  const examSubjectIds = subjects.map((s) => s.id);
  const marksByStudent = new Map<
    string,
    Map<string, { marksObtained: number | null; isAbsent: boolean }>
  >();

  if (examSubjectIds.length && students.length) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("exam_marks")
      .select("student_id, exam_subject_id, marks_obtained, is_absent")
      .eq("school_id", input.schoolId)
      .in("exam_subject_id", examSubjectIds)
      .in(
        "student_id",
        students.map((s) => s.id),
      );

    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      let map = marksByStudent.get(row.student_id);
      if (!map) {
        map = new Map();
        marksByStudent.set(row.student_id, map);
      }
      map.set(row.exam_subject_id, {
        marksObtained:
          row.marks_obtained == null ? null : Number(row.marks_obtained),
        isAbsent: Boolean(row.is_absent),
      });
    }
  }

  const columns: ResultSubjectColumn[] = subjects.map((s) => ({
    examSubjectId: s.id,
    subjectId: s.subject_id,
    subjectName: s.subject_name,
    maxMarks: s.max_marks,
    passMarks: s.pass_marks,
  }));

  const rows: ResultStudentRow[] = students.map((student) => {
    const studentMarks = marksByStudent.get(student.id) ?? new Map();
    const scores: ResultStudentRow["scores"] = {};
    let totalObtained = 0;
    let totalMax = 0;
    let complete = subjects.length > 0;
    let passed = subjects.length > 0;

    for (const subject of subjects) {
      const mark = studentMarks.get(subject.id);
      totalMax += subject.max_marks;
      if (!mark) {
        complete = false;
        passed = false;
        scores[subject.id] = {
          marksObtained: null,
          isAbsent: false,
          passed: null,
        };
        continue;
      }
      if (mark.isAbsent) {
        complete = true;
        passed = false;
        scores[subject.id] = {
          marksObtained: null,
          isAbsent: true,
          passed: false,
        };
        continue;
      }
      const obtained = mark.marksObtained ?? 0;
      totalObtained += obtained;
      const subjectPassed = obtained >= subject.pass_marks;
      if (!subjectPassed) passed = false;
      scores[subject.id] = {
        marksObtained: obtained,
        isAbsent: false,
        passed: subjectPassed,
      };
    }

    return {
      studentId: student.id,
      admissionNumber: student.admission_number,
      firstName: student.first_name,
      lastName: student.last_name,
      rollNumber: student.roll_number,
      sectionName: student.section_name,
      scores,
      totalObtained,
      totalMax,
      percentage: totalMax > 0 && complete ? (totalObtained / totalMax) * 100 : null,
      passed: complete && passed,
      complete,
    };
  });

  return { subjects: columns, rows };
}
