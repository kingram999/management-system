"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAdminSettings } from "../actions";

export function AdminSettingsForm({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    setError(null);
    const result = await updateAdminSettings(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage("Admin settings saved.");
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="display-font text-3xl">Admin settings</h2>
          <p className="mt-1 text-sm text-muted">
            Update your admin name, login email, and password
          </p>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save settings"}
        </Button>
      </div>

      <div className="grid max-w-xl gap-4">
        <div>
          <Label htmlFor="fullName">Display name</Label>
          <Input id="fullName" name="fullName" defaultValue={fullName} required />
        </div>
        <div>
          <Label htmlFor="email">Login email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={email}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Leave blank to keep current password"
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted">
        OTP verification to your registered contact number will be required for
        password changes in a future update. That step is not enabled yet.
      </div>

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </form>
  );
}
