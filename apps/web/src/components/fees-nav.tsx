"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const FEES_NAV = [
  { href: "/admin/fees", label: "Overview" },
  { href: "/admin/fees/dues", label: "Student dues" },
  { href: "/admin/fees/collect", label: "Collect payment" },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/admin/fees") {
    return pathname === "/admin/fees";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function FeesNav({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "mobile";
}) {
  const pathname = usePathname();
  const onFees = pathname.startsWith("/admin/fees");
  const [open, setOpen] = useState(onFees);

  useEffect(() => {
    if (onFees) setOpen(true);
  }, [onFees]);

  if (variant === "mobile") {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
            onFees
              ? "border-brand bg-brand text-white"
              : "border-border bg-card"
          }`}
        >
          Fee {open ? "▴" : "▾"}
        </button>
        {open
          ? FEES_NAV.map((item) => (
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
          onFees ? "bg-background text-brand" : "text-foreground"
        }`}
      >
        <span>Fee</span>
        <span className="text-xs text-muted">{open ? "▴" : "▾"}</span>
      </button>

      {open ? (
        <div className="mt-1 ml-3 space-y-0.5 border-l border-border pl-2">
          {FEES_NAV.map((item) => {
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
