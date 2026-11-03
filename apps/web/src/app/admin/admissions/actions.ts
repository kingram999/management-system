"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { computeFinalFee, type ConcessionType } from "@/lib/academic-years";
import { requireAdmin } from "@/lib/auth";
import { resolveClassForYear } from "@/lib/data/academic-years";
import { updateEnquiryStatus } from "@/lib/data/enquiries";
import { uploadStudentPhoto } from "@/lib/data/students";
import type { EnquiryStatus } from "@/lib/data/types";
import { createClient } from "@/lib/supabase/server";

const MAX_PHOTO_BYTES = 200 * 1024;

async function nextRegistrationNumber(schoolId: string, yearName: string) {
  const supabase = await createClient();
  const yearPrefix =
    yearName.split("-")[0] || new Date().getFullYear().toString();
  const prefix = `REG-${yearPrefix}-`;

  const { count } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("school_id", schoolId);

  const next = (count ?? 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

async function nextApplicationNumber(schoolId: string, yearName: string) {
  const supabase = await createClient();
  const yearPrefix =
    yearName.split("-")[0] || new Date().getFullYear().toString();
  const prefix = `ADM-${yearPrefix}-`;

  const { count } = await supabase
    .from("admission_applications")
    .select("*", { count: "exact", head: true })
    .eq("school_id", schoolId);

  const next = (count ?? 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function createAdmissionApplication(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const academicYearId = String(formData.get("academicYearId") || "");
  const sourceClassId = String(formData.get("classId") || "");
  const feeAmount = Number(formData.get("feeAmount"));
  const concessionTypeRaw = String(formData.get("concessionType") || "");
  const concessionType = (
    concessionTypeRaw === "PERCENT" || concessionTypeRaw === "AMOUNT"
      ? concessionTypeRaw
      : ""
  ) as ConcessionType | "";
  const concessionValue = Number(formData.get("concessionValue") || 0);
  const guardianRelation = String(formData.get("guardianRelation") || "FATHER");
  const guardianRelationOther =
    String(formData.get("guardianRelationOther") || "").trim() || null;
  const guardianPhone = String(formData.get("guardianPhone") || "").trim();
  const guardianPhoneSecondary =
    String(formData.get("guardianPhoneSecondary") || "").trim() || null;

  if (!academicYearId || !sourceClassId) {
    return { error: "Academic year and class are required." };
  }

  if (Number.isNaN(feeAmount) || feeAmount < 0) {
    return { error: "A valid fee amount is required." };
  }

  if (guardianRelation === "OTHER" && !guardianRelationOther) {
    return { error: "Please enter the exact guardian relation." };
  }

  if (!guardianPhone) {
    return { error: "Contact number 1 is required." };
  }

  if (
    concessionType === "PERCENT" &&
    (Number.isNaN(concessionValue) || concessionValue < 0 || concessionValue > 100)
  ) {
    return { error: "Concession percent must be between 0 and 100." };
  }

  if (
    concessionType === "AMOUNT" &&
    (Number.isNaN(concessionValue) || concessionValue < 0)
  ) {
    return { error: "Concession amount must be a valid number." };
  }

  const finalFeeAmount = computeFinalFee(
    feeAmount,
    concessionType,
    concessionValue,
  );

  const { data: year } = await supabase
    .from("academic_years")
    .select("name")
    .eq("id", academicYearId)
    .eq("school_id", profile.school_id)
    .single();

  if (!year) {
    return { error: "Academic year not found." };
  }

  let schoolClass;
  try {
    schoolClass = await resolveClassForYear({
      schoolId: profile.school_id,
      sourceClassId,
      targetAcademicYearId: academicYearId,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Class not found.",
    };
  }

  const applicationNumber = await nextApplicationNumber(
    profile.school_id,
    year.name,
  );
  const registrationNumber = await nextRegistrationNumber(
    profile.school_id,
    year.name,
  );

  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const dateOfBirth = String(formData.get("dateOfBirth") || "");
  const gender = String(formData.get("gender") || "MALE");
  const bloodGroup = String(formData.get("bloodGroup") || "").trim() || null;
  const category = String(formData.get("category") || "").trim() || null;
  const remarks = String(formData.get("remarks") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const city = String(formData.get("city") || "").trim() || null;
  const state = String(formData.get("state") || "").trim() || null;
  const pincode = String(formData.get("pincode") || "").trim() || null;
  const fatherName = String(formData.get("fatherName") || "").trim();
  const motherName = String(formData.get("motherName") || "").trim();
  const guardianName = String(formData.get("guardianName") || "").trim();
  const guardianEmail =
    String(formData.get("guardianEmail") || "").trim() || null;
  const guardianAddress =
    String(formData.get("guardianAddress") || "").trim() || null;

  if (
    !firstName ||
    !lastName ||
    !dateOfBirth ||
    !fatherName ||
    !motherName ||
    !guardianName
  ) {
    return {
      error: "Student, parents, and guardian required fields are missing.",
    };
  }

  const payload = {
    school_id: profile.school_id,
    academic_year_id: academicYearId,
    class_id: schoolClass.id,
    application_number: applicationNumber,
    status: "APPROVED",
    fee_amount: feeAmount,
    concession_type: concessionType || null,
    concession_value: concessionType ? concessionValue : null,
    final_fee_amount: finalFeeAmount,
    first_name: firstName,
    last_name: lastName,
    date_of_birth: dateOfBirth,
    gender,
    blood_group: bloodGroup,
    category,
    remarks,
    previous_school:
      String(formData.get("previousSchool") || "").trim() || null,
    address,
    city,
    state,
    pincode,
    father_name: fatherName,
    mother_name: motherName,
    guardian_name: guardianName,
    guardian_relation: guardianRelation,
    guardian_relation_other:
      guardianRelation === "OTHER" ? guardianRelationOther : null,
    guardian_phone: guardianPhone,
    guardian_phone_secondary: guardianPhoneSecondary,
    guardian_email: guardianEmail,
    guardian_address: guardianAddress,
    submitted_at: new Date().toISOString(),
    reviewed_at: new Date().toISOString(),
    reviewed_by_id: profile.id,
  };

  const { data: application, error } = await supabase
    .from("admission_applications")
    .insert(payload)
    .select("id")
    .single();

  if (error || !application) {
    return { error: error?.message || "Could not create application." };
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      school_id: profile.school_id,
      admission_application_id: application.id,
      admission_number: registrationNumber,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      gender,
      blood_group: bloodGroup,
      category,
      remarks,
      address,
      city,
      state,
      pincode,
      status: "ACTIVE",
      admitted_at: new Date().toISOString(),
    })
    .select("id, admission_number")
    .single();

  if (studentError || !student) {
    await supabase
      .from("admission_applications")
      .delete()
      .eq("id", application.id);
    return {
      error: studentError?.message || "Could not create student record.",
    };
  }

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) {
      return { error: "Photo must be 200 KB or smaller." };
    }
    try {
      const photoUrl = await uploadStudentPhoto(
        profile.school_id,
        student.id,
        photo,
      );
      await supabase
        .from("students")
        .update({ photo_url: photoUrl, updated_at: new Date().toISOString() })
        .eq("id", student.id);
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Could not upload photo.",
      };
    }
  }

  type GuardianDraft = {
    full_name: string;
    relation: string;
    relation_other: string | null;
    phone: string;
    phone_secondary: string | null;
    email: string | null;
    address: string | null;
    is_primary: boolean;
  };

  const namesEqual = (a: string, b: string) =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

  const guardianIsFather =
    guardianRelation === "FATHER" && namesEqual(guardianName, fatherName);
  const guardianIsMother =
    guardianRelation === "MOTHER" && namesEqual(guardianName, motherName);

  const drafts: GuardianDraft[] = [
    {
      full_name: fatherName,
      relation: "FATHER",
      relation_other: null,
      phone: guardianIsFather ? guardianPhone : "—",
      phone_secondary: guardianIsFather ? guardianPhoneSecondary : null,
      email: guardianIsFather ? guardianEmail : null,
      address: guardianIsFather ? guardianAddress : address,
      is_primary: guardianIsFather,
    },
    {
      full_name: motherName,
      relation: "MOTHER",
      relation_other: null,
      phone: guardianIsMother ? guardianPhone : "—",
      phone_secondary: guardianIsMother ? guardianPhoneSecondary : null,
      email: guardianIsMother ? guardianEmail : null,
      address: guardianIsMother ? guardianAddress : address,
      is_primary: guardianIsMother,
    },
  ];

  if (!guardianIsFather && !guardianIsMother) {
    drafts.push({
      full_name: guardianName,
      relation: guardianRelation,
      relation_other:
        guardianRelation === "OTHER" ? guardianRelationOther : null,
      phone: guardianPhone,
      phone_secondary: guardianPhoneSecondary,
      email: guardianEmail,
      address: guardianAddress,
      is_primary: true,
    });
  } else if (!drafts.some((d) => d.is_primary)) {
    drafts[0].is_primary = true;
  }

  for (const draft of drafts) {
    const { data: guardianRow, error: guardianError } = await supabase
      .from("guardians")
      .insert({
        school_id: profile.school_id,
        full_name: draft.full_name,
        relation: draft.relation,
        relation_other: draft.relation_other,
        phone: draft.phone,
        phone_secondary: draft.phone_secondary,
        email: draft.email,
        address: draft.address,
        can_pickup: true,
      })
      .select("id")
      .single();

    if (guardianError || !guardianRow) {
      return {
        error:
          guardianError?.message || "Student created but guardians failed.",
      };
    }

    await supabase.from("student_guardians").insert({
      student_id: student.id,
      guardian_id: guardianRow.id,
      is_primary: draft.is_primary,
    });
  }

  await supabase.from("student_enrollments").insert({
    student_id: student.id,
    academic_year_id: academicYearId,
    class_id: schoolClass.id,
    section_id: null,
  });

  await supabase
    .from("admission_applications")
    .update({
      student_id: student.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", application.id);

  revalidatePath("/admin");
  revalidatePath("/admin/admissions");
  revalidatePath("/admin/admissions/new");
  revalidatePath("/admin/students");
  redirect(`/admin/admissions/${application.id}`);
}

export async function updateApplicationStatus(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const applicationId = String(formData.get("applicationId") || "");
  const status = String(formData.get("status") || "");
  const reviewNotes = String(formData.get("reviewNotes") || "").trim() || null;
  const rejectionReason =
    String(formData.get("rejectionReason") || "").trim() || null;
  const sectionId = String(formData.get("sectionId") || "") || null;

  if (status === "APPROVED") {
    const { error } = await supabase.rpc("approve_admission_application", {
      p_application_id: applicationId,
      p_section_id: sectionId,
      p_review_notes: reviewNotes,
    });

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("admission_applications")
      .update({
        status,
        review_notes: reviewNotes,
        rejection_reason: status === "REJECTED" ? rejectionReason : null,
        reviewed_by_id: profile.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .eq("school_id", profile.school_id);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/admissions");
  revalidatePath(`/admin/admissions/${applicationId}`);
  return { success: true };
}

export async function updateEnquiryStatusAction(formData: FormData) {
  const profile = await requireAdmin();
  const enquiryId = String(formData.get("enquiryId") || "");
  const status = String(formData.get("status") || "") as EnquiryStatus;

  if (
    !enquiryId ||
    !["CONTACTED", "CLOSED", "PENDING", "CONVERTED"].includes(status)
  ) {
    return { error: "Invalid enquiry update." };
  }

  try {
    await updateEnquiryStatus(profile.school_id, enquiryId, status);
    revalidatePath("/admin/admissions/enquiries");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not update enquiry.",
    };
  }
}
