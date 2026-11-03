"use client";

import { useMemo, useState } from "react";
import {
  CLASS_LEVELS,
  DEFAULT_SECTION_NAMES,
  levelsInRange,
} from "@/lib/class-levels";
import { completeSchoolSetup, saveSchoolDetails } from "./actions";

type School = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
};

export function SetupWizard({ school }: { school: School }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [rangeMode, setRangeMode] = useState<"full" | "custom">("full");
  const [fromLevel, setFromLevel] = useState(CLASS_LEVELS[0].numericLevel);
  const [toLevel, setToLevel] = useState(
    CLASS_LEVELS[CLASS_LEVELS.length - 1].numericLevel,
  );
  const [sectionCount, setSectionCount] = useState(2);
  const [sectionNames, setSectionNames] = useState<string[]>(["A", "B"]);

  const effectiveFrom =
    rangeMode === "full" ? CLASS_LEVELS[0].numericLevel : fromLevel;
  const effectiveTo =
    rangeMode === "full"
      ? CLASS_LEVELS[CLASS_LEVELS.length - 1].numericLevel
      : toLevel;

  const selectedLevels = useMemo(
    () => levelsInRange(effectiveFrom, effectiveTo),
    [effectiveFrom, effectiveTo],
  );

  function updateSectionCount(count: number) {
    const next = Math.min(6, Math.max(1, count));
    setSectionCount(next);
    setSectionNames((prev) => {
      const names = [...prev];
      while (names.length < next) {
        names.push(DEFAULT_SECTION_NAMES[names.length] ?? `S${names.length + 1}`);
      }
      return names.slice(0, next);
    });
  }

  async function onSchoolSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await saveSchoolDetails(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep(2);
  }

  async function onFinish() {
    setLoading(true);
    setError(null);
    const result = await completeSchoolSetup({
      fromLevel: effectiveFrom,
      toLevel: effectiveTo,
      sectionNames,
    });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <p className="text-sm font-semibold tracking-wide text-brand">
        First-time setup
      </p>
      <h1 className="display-font mt-2 text-3xl text-foreground">
        Set up your school
      </h1>
      <p className="mt-2 text-sm text-muted">
        Step {step} of 4 — you can change these later in Settings.
      </p>

      <div className="mt-4 flex gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${
              n <= step ? "bg-brand" : "bg-border"
            }`}
          />
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        {step === 1 ? (
          <form action={onSchoolSubmit} className="grid gap-4 sm:grid-cols-2">
            <h2 className="sm:col-span-2 text-lg font-semibold">School details</h2>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">School name</span>
              <input
                name="name"
                required
                defaultValue={school.name}
                className="w-full rounded-lg border border-border px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Phone</span>
              <input
                name="phone"
                defaultValue={school.phone ?? ""}
                className="w-full rounded-lg border border-border px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Email</span>
              <input
                name="email"
                type="email"
                defaultValue={school.email ?? ""}
                className="w-full rounded-lg border border-border px-3 py-2"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Address</span>
              <input
                name="address"
                defaultValue={school.address ?? ""}
                className="w-full rounded-lg border border-border px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">City</span>
              <input
                name="city"
                defaultValue={school.city ?? ""}
                className="w-full rounded-lg border border-border px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">State</span>
              <input
                name="state"
                defaultValue={school.state ?? ""}
                className="w-full rounded-lg border border-border px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Pincode</span>
              <input
                name="pincode"
                defaultValue={school.pincode ?? ""}
                className="w-full rounded-lg border border-border px-3 py-2"
              />
            </label>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Saving…" : "Continue"}
              </button>
            </div>
          </form>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Class range</h2>
            <p className="text-sm text-muted">
              Choose Nursery to Class 12, or a custom range.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRangeMode("full")}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                  rangeMode === "full"
                    ? "bg-brand text-white"
                    : "border border-border bg-background"
                }`}
              >
                Nursery → Class 12
              </button>
              <button
                type="button"
                onClick={() => setRangeMode("custom")}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                  rangeMode === "custom"
                    ? "bg-brand text-white"
                    : "border border-border bg-background"
                }`}
              >
                Custom range
              </button>
            </div>

            {rangeMode === "custom" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">From</span>
                  <select
                    value={fromLevel}
                    onChange={(e) => setFromLevel(Number(e.target.value))}
                    className="w-full rounded-lg border border-border px-3 py-2"
                  >
                    {CLASS_LEVELS.map((level) => (
                      <option key={level.numericLevel} value={level.numericLevel}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">To</span>
                  <select
                    value={toLevel}
                    onChange={(e) => setToLevel(Number(e.target.value))}
                    className="w-full rounded-lg border border-border px-3 py-2"
                  >
                    {CLASS_LEVELS.map((level) => (
                      <option key={level.numericLevel} value={level.numericLevel}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            <p className="rounded-lg bg-background px-3 py-2 text-sm text-muted">
              Will create {selectedLevels.length} classes:{" "}
              {selectedLevels.map((l) => l.name).join(", ")}
            </p>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-border px-4 py-2 text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={selectedLevels.length === 0}
                className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Number of sections</h2>
            <p className="text-sm text-muted">
              Same sections will be added to every class (e.g. A, B, C).
            </p>
            <label className="block max-w-xs">
              <span className="mb-1 block text-sm font-medium">Sections per class</span>
              <input
                type="number"
                min={1}
                max={6}
                value={sectionCount}
                onChange={(e) => updateSectionCount(Number(e.target.value) || 1)}
                className="w-full rounded-lg border border-border px-3 py-2"
              />
            </label>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg border border-border px-4 py-2 text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white"
              >
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Name each section</h2>
            <p className="text-sm text-muted">
              These names apply to all {selectedLevels.length} classes.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {sectionNames.map((name, index) => (
                <label key={index} className="block">
                  <span className="mb-1 block text-sm font-medium">
                    Section {index + 1}
                  </span>
                  <input
                    value={name}
                    onChange={(e) => {
                      const next = [...sectionNames];
                      next[index] = e.target.value;
                      setSectionNames(next);
                    }}
                    required
                    className="w-full rounded-lg border border-border px-3 py-2"
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-lg border border-border px-4 py-2 text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onFinish}
                disabled={loading || sectionNames.some((n) => !n.trim())}
                className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Creating…" : "Finish setup"}
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      </div>
    </div>
  );
}
