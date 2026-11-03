"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SETTINGS_NAV } from "@/lib/settings-nav";

export function SettingsNav({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "mobile";
}) {
  const pathname = usePathname();
  const onSettings = pathname.startsWith("/admin/settings");
  const [open, setOpen] = useState(onSettings);

  useEffect(() => {
    if (onSettings) setOpen(true);
  }, [onSettings]);

  if (variant === "mobile") {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
            onSettings
              ? "border-brand bg-brand text-white"
              : "border-border bg-card"
          }`}
        >
          Settings {open ? "▴" : "▾"}
        </button>
        {open
          ? SETTINGS_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
                  pathname === item.href
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
          onSettings ? "bg-background text-brand" : "text-foreground"
        }`}
      >
        <span>Settings</span>
        <span className="text-xs text-muted">{open ? "▴" : "▾"}</span>
      </button>

      {open ? (
        <div className="mt-1 ml-3 space-y-0.5 border-l border-border pl-2">
          {SETTINGS_NAV.map((item) => {
            const active = pathname === item.href;
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
