"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createExamTerm,
  createExamTermForAllClasses,
  deleteExamSubject,
  setExamTermLocked,
  updateExamTerm,
  upsertExamSubject,
} from "@/lib/data/exams";
import {
  createSubject,
  softDeleteSubject,
  updateSubject,
} from "@/lib/data/subjects";

function revalidateExams() {
  revalidatePath("/admin/exams");
  revalidatePath("/admin/settings/examination");
  revalidatePath("/admin/exams/results");
  revalidatePath("/admin/marks");
}

export async function createSubjectAction(formData: FormData) {
  const profile = await requireAdmin();
  try {
    await createSubject({
      schoolId: profile.school_id,
      name: String(formData.get("name") || ""),
      code: String(formData.get("code") || "").trim() || null,
    });
    revalidateExams();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create subject.",
    };
  }
}

export async function updateSubjectAction(formData: FormData) {
  const profile = await requireAdmin();
  try {
    await updateSubject({
      schoolId: profile.school_id,
      id: String(formData.get("id") || ""),
      name: String(formData.get("name") || ""),
      code: String(formData.get("code") || "").trim() || null,
    });
    revalidateExams();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update subject.",
    };
  }
}

export async function deleteSubjectAction(formData: FormData) {
  const profile = await requireAdmin();
  try {
    await softDeleteSubject(profile.school_id, String(formData.get("id") || ""));
    revalidateExams();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not delete subject.",
    };
  }
}

export async function createExamTermAction(formData: FormData) {
  const profile = await requireAdmin();
  const classId = String(formData.get("classId") || "");
  const name = String(formData.get("name") || "");
  const academicYearId = String(formData.get("academicYearId") || "");
  const startDate = String(formData.get("startDate") || "").trim() || null;
  const endDate = String(formData.get("endDate") || "").trim() || null;

  try {
    if (classId === "ALL") {
      const result = await createExamTermForAllClasses({
        schoolId: profile.school_id,
        academicYearId,
        name,
        startDate,
        endDate,
      });
      revalidateExams();
      const skipNote =
        result.skipped > 0
          ? ` (${result.skipped} class${result.skipped === 1 ? "" : "es"} already had this exam)`
          : "";
      return {
        success: true,
        message: `Created exam for ${result.created} class${result.created === 1 ? "" : "es"}${skipNote}.`,
      };
    }

    await createExamTerm({
      schoolId: profile.school_id,
      academicYearId,
      name,
      classId,
      sectionId: String(formData.get("sectionId") || "").trim() || null,
      startDate,
      endDate,
    });
    revalidateExams();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create exam.",
    };
  }
}

export async function updateExamTermAction(formData: FormData) {
  const profile = await requireAdmin();
  try {
    await updateExamTerm({
      schoolId: profile.school_id,
      id: String(formData.get("id") || ""),
      name: String(formData.get("name") || ""),
      startDate: String(formData.get("startDate") || "").trim() || null,
      endDate: String(formData.get("endDate") || "").trim() || null,
    });
    revalidateExams();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update exam.",
    };
  }
}

export async function setExamTermLockedAction(formData: FormData) {
  const profile = await requireAdmin();
  try {
    await setExamTermLocked({
      schoolId: profile.school_id,
      id: String(formData.get("id") || ""),
      isLocked: String(formData.get("isLocked") || "") === "true",
    });
    revalidateExams();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update lock.",
    };
  }
}

export async function upsertExamSubjectAction(formData: FormData) {
  const profile = await requireAdmin();
  try {
    await upsertExamSubject({
      schoolId: profile.school_id,
      id: String(formData.get("id") || "").trim() || null,
      examTermId: String(formData.get("examTermId") || ""),
      subjectId: String(formData.get("subjectId") || ""),
      classId: String(formData.get("classId") || ""),
      maxMarks: Number(formData.get("maxMarks")),
      passMarks: Number(formData.get("passMarks")),
    });
    revalidateExams();
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not save exam subject.",
    };
  }
}

export async function deleteExamSubjectAction(formData: FormData) {
  const profile = await requireAdmin();
  try {
    await deleteExamSubject(
      profile.school_id,
      String(formData.get("id") || ""),
    );
    revalidateExams();
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not remove subject.",
    };
  }
}
