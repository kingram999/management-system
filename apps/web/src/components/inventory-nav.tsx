"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const INVENTORY_NAV = [
  { href: "/admin/inventory", label: "Overview" },
  { href: "/admin/inventory/items", label: "Items" },
  { href: "/admin/inventory/movements", label: "Movements" },
  { href: "/admin/inventory/ledger", label: "Income & expense" },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/admin/inventory") {
    return pathname === "/admin/inventory";
  }
  if (href === "/admin/inventory/items") {
    return (
      pathname === "/admin/inventory/items" ||
      pathname.startsWith("/admin/inventory/items/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function InventoryNav({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "mobile";
}) {
  const pathname = usePathname();
  const onInventory = pathname.startsWith("/admin/inventory");
  const [open, setOpen] = useState(onInventory);

  useEffect(() => {
    if (onInventory) setOpen(true);
  }, [onInventory]);

  if (variant === "mobile") {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
            onInventory
              ? "border-brand bg-brand text-white"
              : "border-border bg-card"
          }`}
        >
          Inventory {open ? "▴" : "▾"}
        </button>
        {open
          ? INVENTORY_NAV.map((item) => (
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
          onInventory ? "bg-background text-brand" : "text-foreground"
        }`}
      >
        <span>Inventory</span>
        <span className="text-xs text-muted">{open ? "▴" : "▾"}</span>
      </button>

      {open ? (
        <div className="mt-1 ml-3 space-y-0.5 border-l border-border pl-2">
          {INVENTORY_NAV.map((item) => {
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
