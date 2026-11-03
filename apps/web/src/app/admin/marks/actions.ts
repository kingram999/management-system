"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { saveMarksSheet } from "@/lib/data/marks";

export async function saveMarksAction(input: {
  examSubjectId: string;
  marks: Array<{
    studentId: string;
    sectionId?: string | null;
    marksObtained: number | null;
    isAbsent: boolean;
  }>;
}) {
  const profile = await requireAdmin();
  if (!input.examSubjectId) return { error: "Exam subject is required." };

  try {
    const result = await saveMarksSheet({
      schoolId: profile.school_id,
      enteredById: profile.id,
      examSubjectId: input.examSubjectId,
      marks: input.marks,
    });
    revalidatePath("/admin/marks");
    revalidatePath("/admin/exams/results");
    return { success: true, saved: result.saved };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save marks.",
    };
  }
}
