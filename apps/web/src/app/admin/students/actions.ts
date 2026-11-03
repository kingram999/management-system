"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  assignRollNumbers,
  assignSections,
} from "@/lib/data/assignment";
import { sendGuardianMessageLog } from "@/lib/data/communication";
import {
  createEnrolledStudent,
  formDataToEnrolledInput,
  type EnrolledStudentInput,
} from "@/lib/data/enrolled-student";
import {
  setPrimaryGuardian,
  updateGuardianDetails,
  updateStudentPersonal,
} from "@/lib/data/students";

function revalidateStudent(studentId: string) {
  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/students/new");
  revalidatePath("/admin/students/assign-sections");
  revalidatePath("/admin/students/assign-roll-numbers");
  revalidatePath("/admin/students/communication");
}

function revalidateAssignmentPages() {
  revalidatePath("/admin/students");
  revalidatePath("/admin/students/assign-sections");
  revalidatePath("/admin/students/assign-roll-numbers");
}

export async function createEnrolledStudentAction(formData: FormData) {
  const profile = await requireAdmin();
  const input = formDataToEnrolledInput(
    formData,
    profile.school_id,
    profile.id,
  );

  if (
    !input.academicYearId ||
    !input.classId ||
    !input.firstName ||
    !input.lastName ||
    !input.dateOfBirth ||
    !input.fatherName ||
    !input.motherName ||
    !input.guardianName ||
    !input.guardianPhone
  ) {
    return { error: "Please fill all required fields." };
  }

  let studentId = "";
  try {
    const student = await createEnrolledStudent(input);
    studentId = student.id;
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not create student.",
    };
  }

  revalidateStudent(studentId);
  redirect(`/admin/students/${studentId}`);
}

export async function importEnrolledStudentsAction(rows: EnrolledStudentInput[]) {
  const profile = await requireAdmin();
  if (!rows.length) return { error: "No rows to import." };
  if (rows.length > 500) {
    return { error: "Import is limited to 500 rows at a time." };
  }

  let success = 0;
  const errors: string[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = {
      ...rows[index],
      schoolId: profile.school_id,
      profileId: profile.id,
    };
    try {
      if (
        !row.academicYearId ||
        !row.classId ||
        !row.firstName ||
        !row.lastName ||
        !row.dateOfBirth ||
        !row.fatherName ||
        !row.motherName ||
        !row.guardianName ||
        !row.guardianPhone
      ) {
        throw new Error("Missing required fields.");
      }
      await createEnrolledStudent(row);
      success += 1;
    } catch (error) {
      errors.push(
        `Row ${index + 1}: ${
          error instanceof Error ? error.message : "Failed"
        }`,
      );
      if (errors.length >= 20) break;
    }
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin/students/new");
  return {
    success: true,
    imported: success,
    failed: rows.length - success,
    errors,
  };
}

export async function assignSectionsAction(input: {
  classId: string;
  studentIds: string[];
  mode: "SETTINGS" | "MANUAL";
  sectionId?: string | null;
}) {
  const profile = await requireAdmin();
  try {
    const result = await assignSections({
      schoolId: profile.school_id,
      classId: input.classId,
      studentIds: input.studentIds,
      mode: input.mode,
      sectionId: input.sectionId,
    });
    revalidateAssignmentPages();
    for (const id of input.studentIds) {
      revalidatePath(`/admin/students/${id}`);
    }
    return { success: true, updated: result.updated };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not assign sections.",
    };
  }
}

export async function sendGuardianMessageAction(input: {
  subject: string;
  body: string;
  audienceType: "SINGLE" | "GROUP";
  filterSummary: string | null;
  studentIds: string[];
}) {
  const profile = await requireAdmin();
  try {
    const result = await sendGuardianMessageLog({
      schoolId: profile.school_id,
      sentById: profile.id,
      subject: input.subject,
      body: input.body,
      audienceType: input.audienceType,
      filterSummary: input.filterSummary,
      studentIds: input.studentIds,
    });
    revalidatePath("/admin/students/communication");
    return {
      success: true,
      messageId: result.messageId,
      recipientCount: result.recipientCount,
      studentCount: result.studentCount,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not log message.",
    };
  }
}

export async function assignRollNumbersAction(input: {
  studentIds: string[];
}) {
  const profile = await requireAdmin();
  try {
    const result = await assignRollNumbers({
      schoolId: profile.school_id,
      studentIds: input.studentIds,
    });
    revalidateAssignmentPages();
    for (const id of input.studentIds) {
      revalidatePath(`/admin/students/${id}`);
    }
    return {
      success: true,
      updated: result.updated,
      skipped: result.skipped,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not assign roll numbers.",
    };
  }
}

export async function updateStudentPersonalAction(formData: FormData) {
  const profile = await requireAdmin();
  const studentId = String(formData.get("studentId") || "");
  if (!studentId) return { error: "Student is required." };

  try {
    await updateStudentPersonal(profile.school_id, studentId, {
      first_name: String(formData.get("firstName") || "").trim(),
      last_name: String(formData.get("lastName") || "").trim(),
      date_of_birth: String(formData.get("dateOfBirth") || ""),
      gender: String(formData.get("gender") || "MALE"),
      blood_group: String(formData.get("bloodGroup") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      city: String(formData.get("city") || "").trim() || null,
      state: String(formData.get("state") || "").trim() || null,
      pincode: String(formData.get("pincode") || "").trim() || null,
      nationality: String(formData.get("nationality") || "").trim() || null,
      mother_tongue: String(formData.get("motherTongue") || "").trim() || null,
      id_number: String(formData.get("idNumber") || "").trim() || null,
      house: String(formData.get("house") || "").trim() || null,
      category: String(formData.get("category") || "").trim() || null,
      remarks: String(formData.get("remarks") || "").trim() || null,
      status: String(formData.get("status") || "ACTIVE"),
    });
    revalidateStudent(studentId);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save details.",
    };
  }
}

export async function updateGuardianAction(formData: FormData) {
  const profile = await requireAdmin();
  const studentId = String(formData.get("studentId") || "");
  const guardianId = String(formData.get("guardianId") || "");
  if (!studentId || !guardianId) return { error: "Guardian is required." };

  try {
    await updateGuardianDetails(profile.school_id, guardianId, {
      full_name: String(formData.get("fullName") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      phone_secondary:
        String(formData.get("phoneSecondary") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      occupation: String(formData.get("occupation") || "").trim() || null,
      can_pickup: formData.get("canPickup") === "on",
    });

    if (formData.get("isPrimary") === "on") {
      const linkId = String(formData.get("linkId") || "");
      if (linkId) {
        await setPrimaryGuardian(profile.school_id, studentId, linkId);
      }
    }

    revalidateStudent(studentId);
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not update guardian.",
    };
  }
}

export async function setPrimaryGuardianAction(formData: FormData) {
  const profile = await requireAdmin();
  const studentId = String(formData.get("studentId") || "");
  const linkId = String(formData.get("linkId") || "");
  if (!studentId || !linkId) return { error: "Guardian link is required." };

  try {
    await setPrimaryGuardian(profile.school_id, studentId, linkId);
    revalidateStudent(studentId);
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not set primary contact.",
    };
  }
}
