import { createClient } from "@/lib/supabase/server";
import type { AcademicYearRecord, SchoolRecord } from "./types";

export async function getSchoolById(schoolId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schools")
    .select(
      "id, name, code, phone, email, address, city, state, pincode, logo_url, setup_completed_at, section_assignment_rule, roll_number_assignment_rule",
    )
    .eq("id", schoolId)
    .single();

  if (error) throw new Error(error.message);
  return data as SchoolRecord;
}

export async function updateSchoolAssignmentSettings(
  schoolId: string,
  input: {
    section_assignment_rule: string;
    roll_number_assignment_rule: string;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("schools")
    .update({
      section_assignment_rule: input.section_assignment_rule,
      roll_number_assignment_rule: input.roll_number_assignment_rule,
      updated_at: new Date().toISOString(),
    })
    .eq("id", schoolId);

  if (error) throw new Error(error.message);
}

export async function updateSchoolDetails(
  schoolId: string,
  input: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    logo_url?: string | null;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("schools")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", schoolId);

  if (error) throw new Error(error.message);
}

export async function getCurrentAcademicYear(schoolId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academic_years")
    .select("id, name, start_date, end_date, is_current")
    .eq("school_id", schoolId)
    .eq("is_current", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as AcademicYearRecord | null;
}

export async function uploadSchoolLogo(
  schoolId: string,
  file: File,
): Promise<string> {
  const supabase = await createClient();
  const extension = file.name.split(".").pop() || "png";
  const path = `${schoolId}/logo-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("school-logos")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from("school-logos").getPublicUrl(path);
  return data.publicUrl;
}
