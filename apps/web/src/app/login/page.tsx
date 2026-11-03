import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold tracking-wide text-brand">
          School Admin Portal
        </p>
        <h1 className="display-font mt-2 text-3xl text-foreground">
          RamSai Public School
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to manage admissions and school records.
        </p>

        {params.error === "unauthorized" ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
            This account is not an active school admin.
          </p>
        ) : null}

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
