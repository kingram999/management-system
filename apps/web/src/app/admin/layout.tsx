import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { isSetupComplete, requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";
  const onSetup = pathname.startsWith("/admin/setup");
  const setupDone = isSetupComplete(profile);

  if (!setupDone && !onSetup) {
    redirect("/admin/setup");
  }

  if (setupDone && onSetup) {
    redirect("/admin");
  }

  if (!setupDone && onSetup) {
    return <>{children}</>;
  }

  return <AdminShell profile={profile}>{children}</AdminShell>;
}
