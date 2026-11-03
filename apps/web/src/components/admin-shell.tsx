import Link from "next/link";
import { AdmissionsNav } from "@/components/admissions-nav";
import { EmployeesNav } from "@/components/employees-nav";
import { ExaminationNav } from "@/components/exams-nav";
import { FeesNav } from "@/components/fees-nav";
import { InventoryNav } from "@/components/inventory-nav";
import { SchoolBanner } from "@/components/school-banner";
import { SettingsNav } from "@/components/settings-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { StudentsNav } from "@/components/students-nav";
import { TransportNav } from "@/components/transport-nav";
import type { AdminProfile } from "@/lib/auth";

const topLinks = [{ href: "/admin", label: "Dashboard" }];
const moduleLinks = [{ href: "/admin/parents", label: "Parents" }];

export function AdminShell({
  profile,
  children,
}: {
  profile: AdminProfile;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SchoolBanner school={profile.school} />

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 md:px-6">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-border bg-card p-5 shadow-sm md:block">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            ERP Admin
          </p>
          <p className="mt-2 text-sm text-muted">{profile.full_name}</p>

          <nav className="mt-8 space-y-1">
            {topLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-background"
              >
                {link.label}
              </Link>
            ))}
            <AdmissionsNav variant="sidebar" />
            <StudentsNav variant="sidebar" />
            <FeesNav variant="sidebar" />
            <ExaminationNav variant="sidebar" />
            <TransportNav variant="sidebar" />
            <EmployeesNav variant="sidebar" />
            <InventoryNav variant="sidebar" />
            {moduleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-background"
              >
                {link.label}
              </Link>
            ))}
            <SettingsNav variant="sidebar" />
          </nav>

          <div className="mt-10 border-t border-border pt-4">
            <SignOutButton />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-sm md:hidden">
            <div>
              <p className="text-xs font-semibold text-brand">ERP Admin</p>
              <p className="font-medium">{profile.full_name}</p>
            </div>
            <SignOutButton />
          </header>

          <nav className="flex items-start gap-2 overflow-x-auto md:hidden">
            {topLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-full border border-border bg-card px-3 py-1.5 text-sm"
              >
                {link.label}
              </Link>
            ))}
            <AdmissionsNav variant="mobile" />
            <StudentsNav variant="mobile" />
            <FeesNav variant="mobile" />
            <ExaminationNav variant="mobile" />
            <TransportNav variant="mobile" />
            <EmployeesNav variant="mobile" />
            <InventoryNav variant="mobile" />
            {moduleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-full border border-border bg-card px-3 py-1.5 text-sm"
              >
                {link.label}
              </Link>
            ))}
            <SettingsNav variant="mobile" />
          </nav>

          <main className="flex-1 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
