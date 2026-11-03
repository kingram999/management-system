import { createClient } from "@/lib/supabase/server";

export type SubjectRecord = {
  id: string;
  name: string;
  code: string | null;
};

export async function listSubjects(schoolId: string): Promise<SubjectRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, code")
    .eq("school_id", schoolId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createSubject(input: {
  schoolId: string;
  name: string;
  code?: string | null;
}): Promise<SubjectRecord> {
  const name = input.name.trim();
  if (!name) throw new Error("Subject name is required.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .insert({
      school_id: input.schoolId,
      name,
      code: input.code?.trim() || null,
    })
    .select("id, name, code")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("A subject with this name already exists.");
    }
    throw new Error(error?.message || "Could not create subject.");
  }
  return data;
}

export async function updateSubject(input: {
  schoolId: string;
  id: string;
  name: string;
  code?: string | null;
}): Promise<SubjectRecord> {
  const name = input.name.trim();
  if (!name) throw new Error("Subject name is required.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .update({
      name,
      code: input.code?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("school_id", input.schoolId)
    .is("deleted_at", null)
    .select("id, name, code")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("A subject with this name already exists.");
    }
    throw new Error(error?.message || "Could not update subject.");
  }
  return data;
}

export async function softDeleteSubject(
  schoolId: string,
  id: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("subjects")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("school_id", schoolId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
}
