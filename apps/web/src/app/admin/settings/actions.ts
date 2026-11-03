"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createClassOrSection,
  softDeleteSection,
  updateSectionRow,
} from "@/lib/data/classes";
import {
  updateAdminAuthEmail,
  updateAdminPassword,
  updateAdminProfile,
} from "@/lib/data/admin";
import { isAssignmentRule } from "@/lib/assignment-rules";
import {
  updateSchoolAssignmentSettings,
  updateSchoolDetails,
  uploadSchoolLogo,
} from "@/lib/data/school";

function revalidateSettings() {
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/system");
  revalidatePath("/admin/settings/classes");
  revalidatePath("/admin/settings/assignment");
  revalidatePath("/admin/settings/admin");
  revalidatePath("/admin/admissions");
  revalidatePath("/admin/admissions/new");
}

const MAX_LOGO_BYTES = 200 * 1024;

export async function updateSchool(formData: FormData) {
  const profile = await requireAdmin();

  try {
    let logoUrl: string | undefined;
    const logo = formData.get("logo");

    if (logo instanceof File && logo.size > 0) {
      if (logo.size > MAX_LOGO_BYTES) {
        return { error: "Logo must be 200 KB or smaller." };
      }
      if (!logo.type.startsWith("image/")) {
        return { error: "Logo must be an image file." };
      }
      logoUrl = await uploadSchoolLogo(profile.school_id, logo);
    }

    await updateSchoolDetails(profile.school_id, {
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      city: String(formData.get("city") || "").trim() || null,
      state: String(formData.get("state") || "").trim() || null,
      pincode: String(formData.get("pincode") || "").trim() || null,
      ...(logoUrl !== undefined ? { logo_url: logoUrl } : {}),
    });

    revalidateSettings();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save settings.",
    };
  }
}

export async function createClass(formData: FormData) {
  const profile = await requireAdmin();
  const academicYearId = String(formData.get("academicYearId") || "");
  const className = String(formData.get("className") || "").trim();
  const sectionName = String(formData.get("sectionName") || "").trim();
  const headTeacherName =
    String(formData.get("headTeacherName") || "").trim() || null;
  const numericLevel = Number(formData.get("numericLevel"));

  if (!academicYearId || !className || !sectionName || Number.isNaN(numericLevel)) {
    return { error: "Class name, level, and section are required." };
  }

  try {
    await createClassOrSection({
      schoolId: profile.school_id,
      academicYearId,
      className,
      numericLevel,
      sectionName,
      headTeacherName,
    });
    revalidateSettings();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create class.",
    };
  }
}

export async function updateSectionRowAction(formData: FormData) {
  const profile = await requireAdmin();
  const sectionId = String(formData.get("sectionId") || "");
  const classId = String(formData.get("classId") || "");
  const className = String(formData.get("className") || "").trim();
  const sectionName = String(formData.get("sectionName") || "").trim();
  const headTeacherName =
    String(formData.get("headTeacherName") || "").trim() || null;
  const annualFee = Number(formData.get("annualFee"));

  if (!sectionId || !classId || !className || !sectionName) {
    return { error: "Class and section names are required." };
  }

  if (Number.isNaN(annualFee) || annualFee < 0) {
    return { error: "A valid fee amount is required." };
  }

  try {
    await updateSectionRow(profile.school_id, {
      sectionId,
      classId,
      className,
      sectionName,
      headTeacherName,
      annualFee,
    });
    revalidateSettings();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update row.",
    };
  }
}

export async function deleteSectionAction(formData: FormData) {
  const profile = await requireAdmin();
  const sectionId = String(formData.get("sectionId") || "");
  if (!sectionId) return { error: "Section is required." };

  try {
    await softDeleteSection(profile.school_id, sectionId);
    revalidateSettings();
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not delete section.",
    };
  }
}

export async function updateAssignmentSettings(formData: FormData) {
  const profile = await requireAdmin();
  const sectionAssignmentRule = String(
    formData.get("sectionAssignmentRule") || "",
  ).trim();
  const rollNumberAssignmentRule = String(
    formData.get("rollNumberAssignmentRule") || "",
  ).trim();

  if (
    !isAssignmentRule(sectionAssignmentRule) ||
    !isAssignmentRule(rollNumberAssignmentRule)
  ) {
    return { error: "Choose a valid assignment rule for each field." };
  }

  try {
    await updateSchoolAssignmentSettings(profile.school_id, {
      section_assignment_rule: sectionAssignmentRule,
      roll_number_assignment_rule: rollNumberAssignmentRule,
    });
    revalidateSettings();
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not save assignment settings.",
    };
  }
}

export async function updateAdminSettings(formData: FormData) {
  const profile = await requireAdmin();
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!fullName || !email) {
    return { error: "Name and email are required." };
  }

  if (password || confirmPassword) {
    if (password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }
    if (password !== confirmPassword) {
      return { error: "Passwords do not match." };
    }
  }

  try {
    await updateAdminProfile(profile.id, { fullName, email });

    if (email !== profile.email) {
      await updateAdminAuthEmail(email);
    }

    if (password) {
      await updateAdminPassword(password);
    }

    revalidateSettings();
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not update admin settings.",
    };
  }
}
