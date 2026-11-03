import { createClient } from "@/lib/supabase/server";
import type { AdmissionEnquiryRecord, EnquiryStatus } from "./types";

export async function listAdmissionEnquiries(
  schoolId: string,
  status?: EnquiryStatus | "ALL",
) {
  const supabase = await createClient();
  let query = supabase
    .from("admission_enquiries")
    .select(
      "id, student_name, guardian_name, phone, email, interested_class, message, status, created_at",
    )
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  if (status && status !== "ALL") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as AdmissionEnquiryRecord[];
}

export async function updateEnquiryStatus(
  schoolId: string,
  enquiryId: string,
  status: EnquiryStatus,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("admission_enquiries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", enquiryId)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);
}
