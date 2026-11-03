"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const EMPLOYEES_NAV = [
  { href: "/admin/employees", label: "Overview" },
  { href: "/admin/employees/directory", label: "Directory" },
  { href: "/admin/employees/attendance", label: "Attendance" },
  { href: "/admin/employees/payroll", label: "Payroll" },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/admin/employees") {
    return pathname === "/admin/employees";
  }
  if (href === "/admin/employees/directory") {
    if (pathname.startsWith("/admin/employees/directory")) return true;
    // Employee profile pages live under /admin/employees/[id]
    const rest = pathname.replace(/^\/admin\/employees\/?/, "");
    if (!rest) return false;
    if (
      rest.startsWith("attendance") ||
      rest.startsWith("payroll") ||
      rest.startsWith("directory")
    ) {
      return false;
    }
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function EmployeesNav({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "mobile";
}) {
  const pathname = usePathname();
  const onEmployees = pathname.startsWith("/admin/employees");
  const [open, setOpen] = useState(onEmployees);

  useEffect(() => {
    if (onEmployees) setOpen(true);
  }, [onEmployees]);

  if (variant === "mobile") {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
            onEmployees
              ? "border-brand bg-brand text-white"
              : "border-border bg-card"
          }`}
        >
          Employees {open ? "▴" : "▾"}
        </button>
        {open
          ? EMPLOYEES_NAV.map((item) => (
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
          onEmployees ? "bg-background text-brand" : "text-foreground"
        }`}
      >
        <span>Employees</span>
        <span className="text-xs text-muted">{open ? "▴" : "▾"}</span>
      </button>

      {open ? (
        <div className="mt-1 ml-3 space-y-0.5 border-l border-border pl-2">
          {EMPLOYEES_NAV.map((item) => {
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
