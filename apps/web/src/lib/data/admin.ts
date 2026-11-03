import { createClient } from "@/lib/supabase/server";

export async function updateAdminProfile(
  profileId: string,
  input: { fullName: string; email: string },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      email: input.email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error) throw new Error(error.message);
}

export async function updateAdminAuthEmail(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw new Error(error.message);
}

export async function updateAdminPassword(password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}
