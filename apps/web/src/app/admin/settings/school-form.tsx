"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSchool } from "./actions";

type School = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  logo_url: string | null;
};

const MAX_LOGO_BYTES = 200 * 1024;

export function SchoolForm({ school }: { school: School }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(school.logo_url);
  const [selectedLogoName, setSelectedLogoName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  function clearLogoSelection() {
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
    setSelectedLogoName(null);
    setPreview(school.logo_url);
    setError(null);
  }

  async function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

    const logo = formData.get("logo");
    if (logo instanceof File && logo.size > 0) {
      if (logo.size > MAX_LOGO_BYTES) {
        setError("Logo must be 200 KB or smaller.");
        return;
      }
      if (!logo.type.startsWith("image/")) {
        setError("Logo must be an image file.");
        return;
      }
    }

    setLoading(true);
    const result = await updateSchool(formData);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage("Settings saved.");
    setSelectedLogoName(null);
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="display-font text-3xl">School settings</h2>
          <p className="mt-1 text-sm text-muted">
            School branding and contact details
          </p>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save settings"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="logo">Logo</Label>
          <div className="mt-1 flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="School logo preview"
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <span className="text-xs text-muted">No logo</span>
              )}
            </div>

            <div className="flex min-w-0 max-w-sm flex-1 items-center gap-2">
              <input
                ref={logoInputRef}
                id="logo"
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > MAX_LOGO_BYTES) {
                    setError("Logo must be 200 KB or smaller.");
                    event.target.value = "";
                    setSelectedLogoName(null);
                    return;
                  }
                  setError(null);
                  setSelectedLogoName(file.name);
                  setPreview(URL.createObjectURL(file));
                }}
              />

              {selectedLogoName ? (
                <>
                  <span
                    className="min-w-0 flex-1 truncate rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
                    title={selectedLogoName}
                  >
                    {selectedLogoName}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Clear logo selection"
                    onClick={clearLogoSelection}
                  >
                    <X className="h-4 w-4 text-danger" />
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => logoInputRef.current?.click()}
                >
                  Browse
                </Button>
              )}
            </div>
          </div>
          <p className="mt-1.5 text-xs text-muted">
            PNG, JPG, or WebP. Maximum 200 KB.
          </p>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="name">School name</Label>
          <Input id="name" name="name" defaultValue={school.name} required />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={school.phone ?? ""} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={school.email ?? ""}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={school.address ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={school.city ?? ""} />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" defaultValue={school.state ?? ""} />
        </div>
        <div>
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            name="pincode"
            defaultValue={school.pincode ?? ""}
          />
        </div>
      </div>

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </form>
  );
}
