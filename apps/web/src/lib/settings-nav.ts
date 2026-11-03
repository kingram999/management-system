export type SettingsNavItem = {
  href: string;
  label: string;
  description: string;
  comingSoon?: boolean;
};

export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    href: "/admin/settings/system",
    label: "School settings",
    description: "School branding and contact details",
  },
  {
    href: "/admin/settings/classes",
    label: "Class settings",
    description: "Classes and sections",
  },
  {
    href: "/admin/settings/assignment",
    label: "Assignment settings",
    description: "Section and roll number assignment rules",
  },
  {
    href: "/admin/settings/examination",
    label: "Examination Settings",
    description: "Subjects catalog for exams and marks",
  },
  {
    href: "/admin/settings/admin",
    label: "Admin settings",
    description: "Admin profile and login password",
  },
  {
    href: "/admin/settings/students",
    label: "Student settings",
    description: "Student information defaults",
    comingSoon: true,
  },
  {
    href: "/admin/settings/admissions",
    label: "Admission settings",
    description: "Admission form and workflow options",
    comingSoon: true,
  },
  {
    href: "/admin/settings/employees",
    label: "Employee settings",
    description: "Staff roles and employee records",
    comingSoon: true,
  },
];
