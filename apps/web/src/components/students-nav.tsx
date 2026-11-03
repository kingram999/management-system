"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STUDENTS_NAV = [
  { href: "/admin/students", label: "Student directory" },
  { href: "/admin/students/new", label: "Add Students" },
  { href: "/admin/students/assign-sections", label: "Assign sections" },
  {
    href: "/admin/students/assign-roll-numbers",
    label: "Assign Roll Numbers",
  },
  { href: "/admin/students/communication", label: "Communication" },
  { href: "/admin/students/attendance", label: "Attendance" },
  { href: "/admin/students/promote", label: "Promote — year end" },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/admin/students") {
    return pathname === "/admin/students";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StudentsNav({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "mobile";
}) {
  const pathname = usePathname();
  const onStudents = pathname.startsWith("/admin/students");
  const [open, setOpen] = useState(onStudents);

  useEffect(() => {
    if (onStudents) setOpen(true);
  }, [onStudents]);

  if (variant === "mobile") {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
            onStudents
              ? "border-brand bg-brand text-white"
              : "border-border bg-card"
          }`}
        >
          Students {open ? "▴" : "▾"}
        </button>
        {open
          ? STUDENTS_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
                  isNavActive(pathname, item.href)
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border bg-card"
                }`}
              >
                {item.label}
              </Link>
            ))
          : null}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-background ${
          onStudents ? "bg-background text-brand" : "text-foreground"
        }`}
      >
        <span>Students</span>
        <span className="text-xs text-muted">{open ? "▴" : "▾"}</span>
      </button>

      {open ? (
        <div className="mt-1 ml-3 space-y-0.5 border-l border-border pl-2">
          {STUDENTS_NAV.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm transition hover:bg-background ${
                  active
                    ? "bg-background font-semibold text-brand"
                    : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
