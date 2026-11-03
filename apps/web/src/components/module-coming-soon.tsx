export function ModuleComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="display-font text-3xl">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <div className="mt-8 rounded-xl border border-dashed border-border bg-background px-4 py-8 text-sm text-muted">
        This module will be available in a later update. You can continue using
        Admissions, Students, and Fees from the navigation menu.
      </div>
    </div>
  );
}
