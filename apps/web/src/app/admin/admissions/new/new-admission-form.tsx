"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  computeFinalFee,
  type ConcessionType,
} from "@/lib/academic-years";
import { formatInr } from "@/lib/class-levels";
import { createAdmissionApplication } from "../actions";

const MAX_PHOTO_BYTES = 200 * 1024;

type Year = { id: string; name: string; is_current: boolean };
type SchoolClass = {
  id: string;
  name: string;
  academic_year_id: string;
  annual_fee: number;
};

export function NewAdmissionForm({
  years,
  classes,
  defaultYearId,
}: {
  years: Year[];
  classes: SchoolClass[];
  defaultYearId?: string;
}) {
  const [yearId, setYearId] = useState(defaultYearId || years[0]?.id || "");
  const [classId, setClassId] = useState(classes[0]?.id || "");
  const [feeAmount, setFeeAmount] = useState(
    String(classes[0]?.annual_fee ?? ""),
  );
  const [concessionType, setConcessionType] = useState<ConcessionType | "">(
    "",
  );
  const [concessionValue, setConcessionValue] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("FATHER");
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function clearPhoto() {
    if (photoInputRef.current) photoInputRef.current.value = "";
    setPhotoName(null);
    setPhotoPreview(null);
  }

  useEffect(() => {
    if (!classId && classes[0]) {
      setClassId(classes[0].id);
      setFeeAmount(String(classes[0].annual_fee));
    }
  }, [classes, classId]);

  function onClassChange(nextClassId: string) {
    setClassId(nextClassId);
    const selected = classes.find((item) => item.id === nextClassId);
    if (selected) {
      setFeeAmount(String(selected.annual_fee));
    }
  }

  const annualFeeNumber = Number(feeAmount) || 0;
  const concessionNumber = Number(concessionValue) || 0;
  const finalFee = useMemo(
    () => computeFinalFee(annualFeeNumber, concessionType, concessionNumber),
    [annualFeeNumber, concessionType, concessionNumber],
  );

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("classId", classId);
    formData.set("feeAmount", feeAmount);
    formData.set("concessionType", concessionType);
    formData.set("concessionValue", concessionValue);
    formData.set("finalFeeAmount", String(finalFee));
    formData.set("guardianRelation", guardianRelation);
    const result = await createAdmissionApplication(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <h3 className="sm:col-span-2 text-lg font-semibold">Applying for</h3>
        <div>
          <Label htmlFor="academicYearId">Academic year</Label>
          <select
            id="academicYearId"
            name="academicYearId"
            value={yearId}
            onChange={(e) => setYearId(e.target.value)}
            className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-brand"
            required
          >
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="classId">Class</Label>
          <select
            id="classId"
            name="classId"
            value={classId}
            onChange={(e) => onClassChange(e.target.value)}
            required
            className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-brand"
          >
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h3 className="sm:col-span-2 text-lg font-semibold">Fee details</h3>
        <div>
          <Label htmlFor="feeAmount">Annual fee (₹)</Label>
          <Input
            id="feeAmount"
            name="feeAmount"
            type="number"
            min={0}
            step={500}
            required
            value={feeAmount}
            onChange={(e) => setFeeAmount(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="concessionValue">Concession</Label>
          <div className="mt-1 flex gap-2">
            <select
              id="concessionType"
              name="concessionType"
              value={concessionType}
              onChange={(e) =>
                setConcessionType(e.target.value as ConcessionType | "")
              }
              className="flex h-10 w-[7.5rem] shrink-0 rounded-lg border border-border bg-card px-2 text-sm outline-none focus:border-brand"
            >
              <option value="">None</option>
              <option value="PERCENT">Percent %</option>
              <option value="AMOUNT">Amount ₹</option>
            </select>
            <Input
              id="concessionValue"
              name="concessionValue"
              type="number"
              min={0}
              step={concessionType === "PERCENT" ? 1 : 100}
              max={concessionType === "PERCENT" ? 100 : undefined}
              disabled={!concessionType}
              placeholder={concessionType === "PERCENT" ? "%" : "₹"}
              value={concessionValue}
              onChange={(e) => setConcessionValue(e.target.value)}
            />
          </div>
        </div>
        <div className="sm:col-span-2 rounded-lg border border-border bg-background px-4 py-3">
          <p className="text-sm text-muted">Fee to be paid</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {formatInr(finalFee)}
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h3 className="sm:col-span-2 text-lg font-semibold">Student details</h3>
        <div className="sm:col-span-2">
          <Label htmlFor="photo">Student photo</Label>
          <div className="mt-1 flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Student photo preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-muted">No photo</span>
              )}
            </div>
            <div className="flex min-w-0 max-w-sm flex-1 items-center gap-2">
              <input
                ref={photoInputRef}
                id="photo"
                name="photo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > MAX_PHOTO_BYTES) {
                    setError("Photo must be 200 KB or smaller.");
                    event.target.value = "";
                    setPhotoName(null);
                    setPhotoPreview(null);
                    return;
                  }
                  setError(null);
                  setPhotoName(file.name);
                  setPhotoPreview(URL.createObjectURL(file));
                }}
              />
              {photoName ? (
                <>
                  <span
                    className="min-w-0 flex-1 truncate rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    title={photoName}
                  >
                    {photoName}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Clear photo"
                    onClick={clearPhoto}
                  >
                    <X className="h-4 w-4 text-danger" />
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => photoInputRef.current?.click()}
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
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" required />
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            name="gender"
            className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-brand"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <Label htmlFor="bloodGroup">Blood group</Label>
          <Input id="bloodGroup" name="bloodGroup" />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-brand"
            defaultValue=""
          >
            <option value="">Select category</option>
            <option value="GENERAL">General</option>
            <option value="OBC">OBC</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
            <option value="EWS">EWS</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <Label htmlFor="previousSchool">Previous school</Label>
          <Input id="previousSchool" name="previousSchool" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" />
        </div>
        <div>
          <Label htmlFor="pincode">Pincode</Label>
          <Input id="pincode" name="pincode" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="remarks">Remarks</Label>
          <textarea
            id="remarks"
            name="remarks"
            rows={3}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h3 className="sm:col-span-2 text-lg font-semibold">Parents</h3>
        <div>
          <Label htmlFor="fatherName">Father&apos;s name</Label>
          <Input id="fatherName" name="fatherName" required />
        </div>
        <div>
          <Label htmlFor="motherName">Mother&apos;s name</Label>
          <Input id="motherName" name="motherName" required />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h3 className="sm:col-span-2 text-lg font-semibold">Guardian details</h3>
        <div>
          <Label htmlFor="guardianName">Guardian name</Label>
          <Input id="guardianName" name="guardianName" required />
        </div>
        <div>
          <Label htmlFor="guardianRelation">Relation</Label>
          <select
            id="guardianRelation"
            name="guardianRelation"
            value={guardianRelation}
            onChange={(e) => setGuardianRelation(e.target.value)}
            className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-brand"
          >
            <option value="FATHER">Father</option>
            <option value="MOTHER">Mother</option>
            <option value="GUARDIAN">Guardian</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        {guardianRelation === "OTHER" ? (
          <div className="sm:col-span-2">
            <Label htmlFor="guardianRelationOther">Exact relation</Label>
            <Input
              id="guardianRelationOther"
              name="guardianRelationOther"
              required
              placeholder="e.g. Uncle, Grandmother"
            />
          </div>
        ) : null}
        <div>
          <Label htmlFor="guardianPhone">Contact number 1</Label>
          <Input id="guardianPhone" name="guardianPhone" required />
        </div>
        <div>
          <Label htmlFor="guardianPhoneSecondary">Contact number 2</Label>
          <Input
            id="guardianPhoneSecondary"
            name="guardianPhoneSecondary"
            placeholder="Optional"
          />
        </div>
        <div>
          <Label htmlFor="guardianEmail">Email</Label>
          <Input id="guardianEmail" name="guardianEmail" type="email" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="guardianAddress">Guardian address</Label>
          <Input id="guardianAddress" name="guardianAddress" />
        </div>
      </section>

      <input type="hidden" name="status" value="APPROVED" />

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Button type="submit" disabled={loading || classes.length === 0}>
        {loading ? "Saving…" : "Create admission"}
      </Button>
    </form>
  );
}
