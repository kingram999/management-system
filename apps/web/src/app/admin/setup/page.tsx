import { redirect } from "next/navigation";
import { isSetupComplete, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SetupWizard } from "./setup-wizard";

export default async function SetupPage() {
  const profile = await requireAdmin();

  if (isSetupComplete(profile)) {
    redirect("/admin");
  }

  const supabase = await createClient();
  const { data: school } = await supabase
    .from("schools")
    .select("name, phone, email, address, city, state, pincode")
    .eq("id", profile.school_id)
    .single();

  if (!school) {
    redirect("/login?error=unauthorized");
  }

  return <SetupWizard school={school} />;
}
