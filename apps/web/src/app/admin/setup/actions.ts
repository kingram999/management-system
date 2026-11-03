"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, isSetupComplete } from "@/lib/auth";
import { defaultAnnualFee, levelsInRange } from "@/lib/class-levels";
import { createClient } from "@/lib/supabase/server";

export async function saveSchoolDetails(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  if (!name) {
    return { error: "School name is required." };
  }

  const { error } = await supabase
    .from("schools")
    .update({
      name,
      phone: String(formData.get("phone") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      city: String(formData.get("city") || "").trim() || null,
      state: String(formData.get("state") || "").trim() || null,
      pincode: String(formData.get("pincode") || "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.school_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/setup");
  return { success: true };
}

export async function completeSchoolSetup(input: {
  fromLevel: number;
  toLevel: number;
  sectionNames: string[];
}) {
  const profile = await requireAdmin();

  if (isSetupComplete(profile)) {
    redirect("/admin");
  }

  const sectionNames = input.sectionNames
    .map((name) => name.trim())
    .filter(Boolean);

  if (sectionNames.length === 0) {
    return { error: "Add at least one section name." };
  }

  const levels = levelsInRange(input.fromLevel, input.toLevel);
  if (levels.length === 0) {
    return { error: "Choose a valid class range." };
  }

  const supabase = await createClient();

  const { data: year, error: yearError } = await supabase
    .from("academic_years")
    .select("id")
    .eq("school_id", profile.school_id)
    .eq("is_current", true)
    .maybeSingle();

  if (yearError || !year) {
    return { error: yearError?.message || "No current academic year found." };
  }

  const now = new Date().toISOString();

  // Soft-delete any existing classes for this year (first-time setup only)
  const { data: existingClasses } = await supabase
    .from("classes")
    .select("id")
    .eq("school_id", profile.school_id)
    .eq("academic_year_id", year.id)
    .is("deleted_at", null);

  const existingIds = (existingClasses ?? []).map((c) => c.id);

  if (existingIds.length > 0) {
    const { error: softClassError } = await supabase
      .from("classes")
      .update({ deleted_at: now, updated_at: now })
      .in("id", existingIds);

    if (softClassError) {
      return { error: softClassError.message };
    }

    const { error: softSectionError } = await supabase
      .from("sections")
      .update({ deleted_at: now, updated_at: now })
      .in("class_id", existingIds)
      .is("deleted_at", null);

    if (softSectionError) {
      return { error: softSectionError.message };
    }
  }

  const classRows = levels.map((level) => ({
    school_id: profile.school_id,
    academic_year_id: year.id,
    name: level.name,
    numeric_level: level.numericLevel,
    annual_fee: defaultAnnualFee(level.numericLevel),
  }));

  const { data: createdClasses, error: classError } = await supabase
    .from("classes")
    .insert(classRows)
    .select("id, name");

  if (classError || !createdClasses) {
    return { error: classError?.message || "Could not create classes." };
  }

  const sectionRows = createdClasses.flatMap((schoolClass) =>
    sectionNames.map((name) => ({
      class_id: schoolClass.id,
      name,
    })),
  );

  const { error: sectionError } = await supabase
    .from("sections")
    .insert(sectionRows);

  if (sectionError) {
    return { error: sectionError.message };
  }

  const { error: schoolError } = await supabase
    .from("schools")
    .update({
      setup_completed_at: now,
      updated_at: now,
    })
    .eq("id", profile.school_id);

  if (schoolError) {
    return { error: schoolError.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/admissions");
  redirect("/admin");
}
