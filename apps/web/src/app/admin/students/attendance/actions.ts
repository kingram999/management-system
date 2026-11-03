"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  isAttendanceStatus,
  saveAttendanceSheet,
  type AttendanceStatus,
} from "@/lib/data/attendance";

export async function saveAttendanceAction(input: {
  date: string;
  classId: string;
  marks: Array<{
    studentId: string;
    sectionId: string | null;
    status: string;
  }>;
}) {
  const profile = await requireAdmin();

  try {
    const marks = input.marks.map((mark) => {
      if (!isAttendanceStatus(mark.status)) {
        throw new Error("Invalid attendance status.");
      }
      return {
        studentId: mark.studentId,
        sectionId: mark.sectionId,
        status: mark.status as AttendanceStatus,
      };
    });

    const result = await saveAttendanceSheet({
      schoolId: profile.school_id,
      markedById: profile.id,
      date: input.date,
      classId: input.classId,
      marks,
    });
    revalidatePath("/admin/students/attendance");
    return { success: true, saved: result.saved };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not save attendance.",
    };
  }
}
