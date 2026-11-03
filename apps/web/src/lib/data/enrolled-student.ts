import { computeFinalFee, type ConcessionType } from "@/lib/academic-years";
import { resolveClassForYear } from "@/lib/data/academic-years";
import { uploadStudentPhoto } from "@/lib/data/students";
import { createClient } from "@/lib/supabase/server";

export type EnrolledStudentInput = {
  schoolId: string;
  profileId: string;
  academicYearId: string;
  classId: string;
  sectionId: string | null;
  rollNumber: string | null;
  registrationNumber?: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  nationality?: string | null;
  motherTongue?: string | null;
  idNumber?: string | null;
  house?: string | null;
  category?: string | null;
  remarks?: string | null;
  status?: string;
  fatherName: string;
  motherName: string;
  guardianName: string;
  guardianRelation: string;
  guardianRelationOther?: string | null;
  guardianPhone: string;
  guardianPhoneSecondary?: string | null;
  guardianEmail?: string | null;
  guardianAddress?: string | null;
  guardianOccupation?: string | null;
  canPickup?: boolean;
  feeAmount?: number | null;
  concessionType?: ConcessionType | "" | null;
  concessionValue?: number | null;
  photo?: File | null;
};

async function nextRegistrationNumber(schoolId: string, yearName: string) {
  const supabase = await createClient();
  const yearPrefix =
    yearName.split("-")[0] || new Date().getFullYear().toString();
  const prefix = `REG-${yearPrefix}-`;

  const { count } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("school_id", schoolId);

  return `${prefix}${String((count ?? 0) + 1).padStart(4, "0")}`;
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

  return `${prefix}${String((count ?? 0) + 1).padStart(4, "0")}`;
}

export async function createEnrolledStudent(input: EnrolledStudentInput) {
  const supabase = await createClient();

  const { data: year } = await supabase
    .from("academic_years")
    .select("name")
    .eq("id", input.academicYearId)
    .eq("school_id", input.schoolId)
    .single();

  if (!year) throw new Error("Academic year not found.");

  const schoolClass = await resolveClassForYear({
    schoolId: input.schoolId,
    sourceClassId: input.classId,
    targetAcademicYearId: input.academicYearId,
  });

  let sectionId = input.sectionId;
  if (sectionId) {
    const { data: section } = await supabase
      .from("sections")
      .select("id, class_id")
      .eq("id", sectionId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!section) throw new Error("Section not found.");
    if (section.class_id !== schoolClass.id) {
      // Section belongs to source class; find matching section name on target class
      const { data: sourceSection } = await supabase
        .from("sections")
        .select("name")
        .eq("id", sectionId)
        .single();
      if (sourceSection) {
        const { data: targetSection } = await supabase
          .from("sections")
          .select("id")
          .eq("class_id", schoolClass.id)
          .eq("name", sourceSection.name)
          .is("deleted_at", null)
          .maybeSingle();
        sectionId = targetSection?.id ?? null;
      }
    }
  }

  const registrationNumber =
    input.registrationNumber?.trim() ||
    (await nextRegistrationNumber(input.schoolId, year.name));
  const applicationNumber = await nextApplicationNumber(
    input.schoolId,
    year.name,
  );

  const feeAmount =
    input.feeAmount != null && !Number.isNaN(input.feeAmount)
      ? input.feeAmount
      : schoolClass.annual_fee;
  const concessionType = (input.concessionType || "") as ConcessionType | "";
  const concessionValue = Number(input.concessionValue || 0);
  const finalFeeAmount = computeFinalFee(
    feeAmount,
    concessionType,
    concessionValue,
  );

  const guardianIsFather =
    input.guardianRelation === "FATHER" &&
    input.guardianName.trim().toLowerCase() ===
      input.fatherName.trim().toLowerCase();
  const guardianIsMother =
    input.guardianRelation === "MOTHER" &&
    input.guardianName.trim().toLowerCase() ===
      input.motherName.trim().toLowerCase();

  const { data: application, error: appError } = await supabase
    .from("admission_applications")
    .insert({
      school_id: input.schoolId,
      academic_year_id: input.academicYearId,
      class_id: schoolClass.id,
      application_number: applicationNumber,
      status: "APPROVED",
      first_name: input.firstName,
      last_name: input.lastName,
      date_of_birth: input.dateOfBirth,
      gender: input.gender,
      blood_group: input.bloodGroup || null,
      category: input.category || null,
      remarks: input.remarks || null,
      previous_school: null,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      pincode: input.pincode || null,
      father_name: input.fatherName,
      mother_name: input.motherName,
      guardian_name: input.guardianName,
      guardian_relation: input.guardianRelation,
      guardian_relation_other:
        input.guardianRelation === "OTHER"
          ? input.guardianRelationOther || null
          : null,
      guardian_phone: input.guardianPhone,
      guardian_phone_secondary: input.guardianPhoneSecondary || null,
      guardian_email: input.guardianEmail || null,
      guardian_address: input.guardianAddress || null,
      fee_amount: feeAmount,
      concession_type: concessionType || null,
      concession_value: concessionType ? concessionValue : null,
      final_fee_amount: finalFeeAmount,
      submitted_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
      reviewed_by_id: input.profileId,
    })
    .select("id")
    .single();

  if (appError || !application) {
    throw new Error(appError?.message || "Could not create application.");
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      school_id: input.schoolId,
      admission_application_id: application.id,
      admission_number: registrationNumber,
      first_name: input.firstName,
      last_name: input.lastName,
      date_of_birth: input.dateOfBirth,
      gender: input.gender,
      blood_group: input.bloodGroup || null,
      category: input.category || null,
      remarks: input.remarks || null,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      pincode: input.pincode || null,
      nationality: input.nationality || null,
      mother_tongue: input.motherTongue || null,
      id_number: input.idNumber || null,
      house: input.house || null,
      status: input.status || "ACTIVE",
      admitted_at: new Date().toISOString(),
    })
    .select("id, admission_number")
    .single();

  if (studentError || !student) {
    await supabase
      .from("admission_applications")
      .delete()
      .eq("id", application.id);
    throw new Error(studentError?.message || "Could not create student.");
  }

  if (input.photo && input.photo.size > 0) {
    const photoUrl = await uploadStudentPhoto(
      input.schoolId,
      student.id,
      input.photo,
    );
    await supabase
      .from("students")
      .update({ photo_url: photoUrl, updated_at: new Date().toISOString() })
      .eq("id", student.id);
  }

  const drafts = [
    {
      full_name: input.fatherName,
      relation: "FATHER",
      relation_other: null as string | null,
      phone: guardianIsFather ? input.guardianPhone : "—",
      phone_secondary: guardianIsFather
        ? input.guardianPhoneSecondary || null
        : null,
      email: guardianIsFather ? input.guardianEmail || null : null,
      address: guardianIsFather
        ? input.guardianAddress || null
        : input.address || null,
      occupation: null as string | null,
      is_primary: guardianIsFather,
    },
    {
      full_name: input.motherName,
      relation: "MOTHER",
      relation_other: null as string | null,
      phone: guardianIsMother ? input.guardianPhone : "—",
      phone_secondary: guardianIsMother
        ? input.guardianPhoneSecondary || null
        : null,
      email: guardianIsMother ? input.guardianEmail || null : null,
      address: guardianIsMother
        ? input.guardianAddress || null
        : input.address || null,
      occupation: null as string | null,
      is_primary: guardianIsMother,
    },
  ];

  if (!guardianIsFather && !guardianIsMother) {
    drafts.push({
      full_name: input.guardianName,
      relation: input.guardianRelation,
      relation_other:
        input.guardianRelation === "OTHER"
          ? input.guardianRelationOther || null
          : null,
      phone: input.guardianPhone,
      phone_secondary: input.guardianPhoneSecondary || null,
      email: input.guardianEmail || null,
      address: input.guardianAddress || null,
      occupation: input.guardianOccupation || null,
      is_primary: true,
    });
  } else if (!drafts.some((d) => d.is_primary)) {
    drafts[0].is_primary = true;
  }

  for (const draft of drafts) {
    const { data: guardian, error: guardianError } = await supabase
      .from("guardians")
      .insert({
        school_id: input.schoolId,
        full_name: draft.full_name,
        relation: draft.relation,
        relation_other: draft.relation_other,
        phone: draft.phone,
        phone_secondary: draft.phone_secondary,
        email: draft.email,
        address: draft.address,
        occupation: draft.occupation,
        can_pickup: input.canPickup ?? true,
      })
      .select("id")
      .single();

    if (guardianError || !guardian) {
      throw new Error(guardianError?.message || "Could not create guardian.");
    }

    await supabase.from("student_guardians").insert({
      student_id: student.id,
      guardian_id: guardian.id,
      is_primary: draft.is_primary,
    });
  }

  await supabase.from("student_enrollments").insert({
    student_id: student.id,
    academic_year_id: input.academicYearId,
    class_id: schoolClass.id,
    section_id: sectionId,
    roll_number: input.rollNumber || null,
  });

  await supabase
    .from("admission_applications")
    .update({
      student_id: student.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", application.id);

  return student;
}

export function formDataToEnrolledInput(
  formData: FormData,
  schoolId: string,
  profileId: string,
): EnrolledStudentInput {
  const concessionTypeRaw = String(formData.get("concessionType") || "");
  const concessionType =
    concessionTypeRaw === "PERCENT" || concessionTypeRaw === "AMOUNT"
      ? concessionTypeRaw
      : "";
  const photo = formData.get("photo");

  return {
    schoolId,
    profileId,
    academicYearId: String(formData.get("academicYearId") || ""),
    classId: String(formData.get("classId") || ""),
    sectionId: String(formData.get("sectionId") || "") || null,
    rollNumber: String(formData.get("rollNumber") || "").trim() || null,
    registrationNumber:
      String(formData.get("registrationNumber") || "").trim() || null,
    firstName: String(formData.get("firstName") || "").trim(),
    lastName: String(formData.get("lastName") || "").trim(),
    dateOfBirth: String(formData.get("dateOfBirth") || ""),
    gender: String(formData.get("gender") || "MALE"),
    bloodGroup: String(formData.get("bloodGroup") || "").trim() || null,
    address: String(formData.get("address") || "").trim() || null,
    city: String(formData.get("city") || "").trim() || null,
    state: String(formData.get("state") || "").trim() || null,
    pincode: String(formData.get("pincode") || "").trim() || null,
    nationality: String(formData.get("nationality") || "").trim() || null,
    motherTongue: String(formData.get("motherTongue") || "").trim() || null,
    idNumber: String(formData.get("idNumber") || "").trim() || null,
    house: String(formData.get("house") || "").trim() || null,
    category: String(formData.get("category") || "").trim() || null,
    remarks: String(formData.get("remarks") || "").trim() || null,
    status: String(formData.get("status") || "ACTIVE"),
    fatherName: String(formData.get("fatherName") || "").trim(),
    motherName: String(formData.get("motherName") || "").trim(),
    guardianName: String(formData.get("guardianName") || "").trim(),
    guardianRelation: String(formData.get("guardianRelation") || "FATHER"),
    guardianRelationOther:
      String(formData.get("guardianRelationOther") || "").trim() || null,
    guardianPhone: String(formData.get("guardianPhone") || "").trim(),
    guardianPhoneSecondary:
      String(formData.get("guardianPhoneSecondary") || "").trim() || null,
    guardianEmail: String(formData.get("guardianEmail") || "").trim() || null,
    guardianAddress:
      String(formData.get("guardianAddress") || "").trim() || null,
    guardianOccupation:
      String(formData.get("guardianOccupation") || "").trim() || null,
    canPickup: formData.get("canPickup") === "on",
    feeAmount: formData.get("feeAmount")
      ? Number(formData.get("feeAmount"))
      : null,
    concessionType,
    concessionValue: formData.get("concessionValue")
      ? Number(formData.get("concessionValue"))
      : null,
    photo: photo instanceof File && photo.size > 0 ? photo : null,
  };
}
