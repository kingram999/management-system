import { SETTINGS_NAV } from "@/lib/settings-nav";

export function SettingsComingSoon({ href }: { href: string }) {
  const item = SETTINGS_NAV.find((entry) => entry.href === href);

  return (
    <div>
      <h2 className="display-font text-3xl">{item?.label ?? "Settings"}</h2>
      <p className="mt-1 text-sm text-muted">{item?.description}</p>
      <div className="mt-8 rounded-xl border border-dashed border-border bg-background px-4 py-8 text-sm text-muted">
        This settings area will be available when the related module is built.
        You can still manage other areas from the Settings tabs above.
      </div>
    </div>
  );
}
