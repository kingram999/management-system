import { requireAdmin } from "@/lib/auth";
import { AdminSettingsForm } from "./admin-settings-form";

export default async function AdminSettingsPage() {
  const profile = await requireAdmin();

  return (
    <AdminSettingsForm
      fullName={profile.full_name}
      email={profile.email}
    />
  );
}
