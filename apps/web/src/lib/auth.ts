import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SchoolRecord } from "@/lib/data/types";

export type AdminProfile = {
  id: string;
  auth_user_id: string;
  school_id: string;
  role: string;
  full_name: string;
  email: string;
  school: Pick<
    SchoolRecord,
    | "id"
    | "name"
    | "code"
    | "phone"
    | "email"
    | "address"
    | "city"
    | "state"
    | "pincode"
    | "logo_url"
    | "setup_completed_at"
  >;
};

export async function requireAdmin(): Promise<AdminProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, auth_user_id, school_id, role, full_name, email, school:schools(id, name, code, phone, email, address, city, state, pincode, logo_url, setup_completed_at)",
    )
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .single();

  if (error || !profile || profile.role !== "ADMIN") {
    redirect("/login?error=unauthorized");
  }

  const school = Array.isArray(profile.school)
    ? profile.school[0]
    : profile.school;

  return {
    ...profile,
    school,
  } as AdminProfile;
}

export function isSetupComplete(profile: AdminProfile) {
  return Boolean(profile.school.setup_completed_at);
}
