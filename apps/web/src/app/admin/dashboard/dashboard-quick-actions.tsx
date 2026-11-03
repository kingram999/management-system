import Link from "next/link";
import {
  ClipboardList,
  IndianRupee,
  CalendarCheck,
  UserPlus,
  MessageSquare,
  PenLine,
  Users,
  FileBarChart,
  CalendarDays,
} from "lucide-react";

const SOON_COLOR = "#6b7280";

const actions = [
  {
    href: "/admin/admissions/new",
    label: "Create Admission",
    icon: ClipboardList,
    color: "#0f6b4c",
  },
  {
    href: "/admin/fees/collect",
    label: "Collect Fees",
    icon: IndianRupee,
    color: "#1f7a4d",
  },
  {
    href: "/admin/students/attendance",
    label: "Attendance",
    icon: CalendarCheck,
    color: "#0a4d37",
  },
  {
    href: "/admin/students/new",
    label: "Add Students",
    icon: UserPlus,
    color: "#2d6a4f",
  },
  {
    href: "/admin/students/communication",
    label: "Communication",
    icon: MessageSquare,
    color: "#40916c",
  },
  {
    href: "/admin/employees",
    label: "Staff / Employees",
    icon: Users,
    color: "#52796f",
  },
  {
    href: "/admin/marks",
    label: "Marks Entry",
    icon: PenLine,
    color: "#b08900",
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: FileBarChart,
    color: SOON_COLOR,
  },
  {
    href: "/admin/timetable",
    label: "Timetable",
    icon: CalendarDays,
    color: SOON_COLOR,
  },
] as const;

export function DashboardQuickActions() {
  return (
    <div className="grid grid-cols-5 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center justify-center gap-2 rounded-xl px-2 py-4 text-center text-white transition hover:opacity-95 hover:shadow-md sm:px-3"
            style={{ backgroundColor: action.color }}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
            <span className="text-[10px] font-medium leading-tight sm:text-xs">
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
