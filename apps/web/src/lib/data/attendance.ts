import { createClient } from "@/lib/supabase/server";
import { listStudentsForDirectory } from "./students";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";

export type AttendanceSheetRow = {
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  classId: string;
  sectionId: string | null;
  status: AttendanceStatus;
  existing: boolean;
  markedByName: string | null;
};

export type AttendanceSheet = {
  date: string;
  classId: string;
  sectionId: string | null;
  rows: AttendanceSheetRow[];
  lastMarkedByName: string | null;
};

const STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "LEAVE"];

export function isAttendanceStatus(value: string): value is AttendanceStatus {
  return STATUSES.includes(value as AttendanceStatus);
}

export async function listAttendanceSheet(input: {
  schoolId: string;
  date: string;
  classId: string;
  sectionId?: string | null;
}): Promise<AttendanceSheet> {
  if (!input.classId) {
    return {
      date: input.date,
      classId: "",
      sectionId: input.sectionId ?? null,
      rows: [],
      lastMarkedByName: null,
    };
  }

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
    const rollA = a.roll_number || "";
    const rollB = b.roll_number || "";
    const rollCmp = rollA.localeCompare(rollB, undefined, { numeric: true });
    if (rollCmp !== 0) return rollCmp;
    return `${a.last_name} ${a.first_name}`.localeCompare(
      `${b.last_name} ${b.first_name}`,
    );
  });

  const supabase = await createClient();
  const studentIds = students.map((s) => s.id);
  const existingByStudent = new Map<
    string,
    { status: AttendanceStatus; markedByName: string | null }
  >();

  if (studentIds.length) {
    const { data, error } = await supabase
      .from("attendance_records")
      .select(
        `
        student_id, status,
        marked_by:profiles!marked_by_id(full_name)
      `,
      )
      .eq("school_id", input.schoolId)
      .eq("attendance_date", input.date)
      .in("student_id", studentIds);

    if (error) throw new Error(error.message);

    for (const row of data ?? []) {
      const markedBy = Array.isArray(row.marked_by)
        ? row.marked_by[0]
        : row.marked_by;
      existingByStudent.set(row.student_id, {
        status: row.status as AttendanceStatus,
        markedByName: markedBy?.full_name ?? null,
      });
    }
  }

  const rows: AttendanceSheetRow[] = students.map((student) => {
    const existing = existingByStudent.get(student.id);
    return {
      studentId: student.id,
      admissionNumber: student.admission_number,
      firstName: student.first_name,
      lastName: student.last_name,
      rollNumber: student.roll_number,
      classId: student.class_id!,
      sectionId: student.section_id,
      status: existing?.status ?? "PRESENT",
      existing: Boolean(existing),
      markedByName: existing?.markedByName ?? null,
    };
  });

  const lastMarkedByName =
    rows.find((row) => row.markedByName)?.markedByName ?? null;

  return {
    date: input.date,
    classId: input.classId,
    sectionId: input.sectionId ?? null,
    rows,
    lastMarkedByName,
  };
}

export async function saveAttendanceSheet(input: {
  schoolId: string;
  markedById: string;
  date: string;
  classId: string;
  marks: Array<{
    studentId: string;
    sectionId: string | null;
    status: AttendanceStatus;
  }>;
}): Promise<{ saved: number }> {
  if (!input.classId) throw new Error("Choose a class.");
  if (!input.date) throw new Error("Choose a date.");
  if (!input.marks.length) throw new Error("No students to mark.");

  for (const mark of input.marks) {
    if (!isAttendanceStatus(mark.status)) {
      throw new Error("Invalid attendance status.");
    }
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const rows = input.marks.map((mark) => ({
    school_id: input.schoolId,
    student_id: mark.studentId,
    class_id: input.classId,
    section_id: mark.sectionId,
    attendance_date: input.date,
    status: mark.status,
    marked_by_id: input.markedById,
    updated_at: now,
  }));

  const { error } = await supabase.from("attendance_records").upsert(rows, {
    onConflict: "student_id,attendance_date",
  });

  if (error) throw new Error(error.message);
  return { saved: rows.length };
}
