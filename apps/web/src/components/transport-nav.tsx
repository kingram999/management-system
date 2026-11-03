"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TRANSPORT_NAV = [
  { href: "/admin/transport", label: "Overview" },
  { href: "/admin/transport/routes", label: "Routes & stops" },
  { href: "/admin/transport/students", label: "Students" },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/admin/transport") {
    return pathname === "/admin/transport";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TransportNav({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "mobile";
}) {
  const pathname = usePathname();
  const onTransport = pathname.startsWith("/admin/transport");
  const [open, setOpen] = useState(onTransport);

  useEffect(() => {
    if (onTransport) setOpen(true);
  }, [onTransport]);

  if (variant === "mobile") {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
            onTransport
              ? "border-brand bg-brand text-white"
              : "border-border bg-card"
          }`}
        >
          Transport {open ? "▴" : "▾"}
        </button>
        {open
          ? TRANSPORT_NAV.map((item) => (
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
          onTransport ? "bg-background text-brand" : "text-foreground"
        }`}
      >
        <span>Transport</span>
        <span className="text-xs text-muted">{open ? "▴" : "▾"}</span>
      </button>

      {open ? (
        <div className="mt-1 ml-3 space-y-0.5 border-l border-border pl-2">
          {TRANSPORT_NAV.map((item) => {
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
