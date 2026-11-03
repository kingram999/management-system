import type { AdminProfile } from "@/lib/auth";

export function SchoolBanner({ school }: { school: AdminProfile["school"] }) {
  return (
    <header className="border-b border-border bg-brand text-white">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-5 px-4 py-5 md:gap-6 md:px-6 md:py-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 md:h-24 md:w-24">
          {school.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={school.logo_url}
              alt={`${school.name} logo`}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <span className="display-font text-3xl text-accent md:text-4xl">
              {school.name.slice(0, 1)}
            </span>
          )}
        </div>

        <h1 className="display-font min-w-0 flex-1 truncate text-3xl leading-tight md:text-5xl">
          {school.name}
        </h1>
      </div>
    </header>
  );
}
