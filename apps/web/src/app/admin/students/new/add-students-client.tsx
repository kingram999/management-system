"use client";

import { X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  computeFinalFee,
  type ConcessionType,
} from "@/lib/academic-years";
import { formatInr } from "@/lib/class-levels";
import type { EnrolledStudentInput } from "@/lib/data/enrolled-student";
import {
  mapImportRow,
  parseCsvText,
  studentImportTemplateCsv,
  type ClassLookup,
  type YearLookup,
} from "@/lib/student-import";
import {
  createEnrolledStudentAction,
  importEnrolledStudentsAction,
} from "../actions";

const MAX_PHOTO_BYTES = 200 * 1024;

export function AddStudentsClient({
  years,
  classes,
  defaultYearId,
  schoolId,
  profileId,
}: {
  years: YearLookup[];
  classes: ClassLookup[];
  defaultYearId?: string;
  schoolId: string;
  profileId: string;
}) {
  const [yearId, setYearId] = useState(defaultYearId || years[0]?.id || "");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [concessionType, setConcessionType] = useState<ConcessionType | "">(
    "",
  );
  const [concessionValue, setConcessionValue] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("FATHER");
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const yearClasses = useMemo(
    () =>
      classes.filter((item) => item.academic_year_id === yearId).length
        ? classes.filter((item) => item.academic_year_id === yearId)
        : classes,
    [classes, yearId],
  );

  const selectedClass = yearClasses.find((item) => item.id === classId);
  const sections = selectedClass?.sections ?? [];

  const finalFee = useMemo(
    () =>
      computeFinalFee(
        Number(feeAmount) || 0,
        concessionType,
        Number(concessionValue) || 0,
      ),
    [feeAmount, concessionType, concessionValue],
  );

  function onClassChange(nextId: string) {
    setClassId(nextId);
    setSectionId("");
    const found = yearClasses.find((item) => item.id === nextId);
    if (found) setFeeAmount(String(found.annual_fee));
  }

  function clearPhoto() {
    if (photoInputRef.current) photoInputRef.current.value = "";
    setPhotoName(null);
    setPhotoPreview(null);
  }

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setMessage(null);
    formData.set("classId", classId);
    formData.set("sectionId", sectionId);
    formData.set("feeAmount", feeAmount);
    formData.set("concessionType", concessionType);
    formData.set("concessionValue", concessionValue);
    formData.set("guardianRelation", guardianRelation);
    const result = await createEnrolledStudentAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([studentImportTemplateCsv()], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImportFile(file: File) {
    setImporting(true);
    setError(null);
    setMessage(null);
    setImportErrors([]);

    try {
      let rawRows: Record<string, unknown>[] = [];
      const lower = file.name.toLowerCase();

      if (lower.endsWith(".csv")) {
        rawRows = parseCsvText(await file.text());
      } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: "",
          raw: false,
        });
      } else {
        throw new Error("Please upload a .csv or .xlsx file.");
      }

      if (!rawRows.length) throw new Error("No data rows found in the file.");

      const mapped: EnrolledStudentInput[] = rawRows.map((row) =>
        mapImportRow(row, years, yearClasses, schoolId, profileId),
      );

      const result = await importEnrolledStudentsAction(mapped);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(
          `Imported ${result.imported} student(s). Failed: ${result.failed}.`,
        );
        setImportErrors(result.errors ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="display-font text-3xl">Add Students</h2>
        <p className="mt-1 text-sm text-muted">
          Add already enrolled students manually or import from CSV / Excel
        </p>
      </div>

      <section className="rounded-xl border border-border p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Import CSV / Excel</h3>
            <p className="mt-1 text-sm text-muted">
              Upload a spreadsheet of enrolled students. Photos are not imported.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={downloadTemplate}>
              Download CSV template
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onImportFile(file);
              }}
            />
            <Button
              type="button"
              disabled={importing}
              onClick={() => importInputRef.current?.click()}
            >
              {importing ? "Importing…" : "Upload CSV / Excel"}
            </Button>
          </div>
        </div>
        {importErrors.length > 0 ? (
          <ul className="mt-4 space-y-1 text-sm text-danger">
            {importErrors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <form action={onSubmit} className="space-y-8">
        <section className="grid gap-4 sm:grid-cols-2">
          <h3 className="sm:col-span-2 text-lg font-semibold">Enrollment</h3>
          <div>
            <Label htmlFor="academicYearId">Academic year</Label>
            <select
              id="academicYearId"
              name="academicYearId"
              value={yearId}
              onChange={(e) => {
                setYearId(e.target.value);
                setClassId("");
                setSectionId("");
                setFeeAmount("");
              }}
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
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
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
              required
            >
              <option value="" disabled>
                Select class
              </option>
              {yearClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="sectionId">Section</Label>
            <select
              id="sectionId"
              name="sectionId"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="">Optional</option>
              {sections.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="rollNumber">Roll number</Label>
            <Input id="rollNumber" name="rollNumber" />
          </div>
          <div>
            <Label htmlFor="registrationNumber">Registration ID</Label>
            <Input
              id="registrationNumber"
              name="registrationNumber"
              placeholder="Auto if blank"
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue="ACTIVE"
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="TRANSFERRED">Transferred</option>
              <option value="ALUMNI">Alumni</option>
              <option value="INACTIVE">Inactive</option>
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
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="concessionValue">Concession</Label>
            <div className="mt-1 flex gap-2">
              <select
                value={concessionType}
                onChange={(e) =>
                  setConcessionType(e.target.value as ConcessionType | "")
                }
                className="flex h-10 w-[7.5rem] shrink-0 rounded-lg border border-border bg-card px-2 text-sm"
              >
                <option value="">None</option>
                <option value="PERCENT">Percent %</option>
                <option value="AMOUNT">Amount ₹</option>
              </select>
              <Input
                type="number"
                min={0}
                disabled={!concessionType}
                value={concessionValue}
                onChange={(e) => setConcessionValue(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:col-span-2 rounded-lg border border-border bg-background px-4 py-3">
            <p className="text-sm text-muted">Fee to be paid</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
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
                    alt=""
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
                      clearPhoto();
                      return;
                    }
                    setError(null);
                    setPhotoName(file.name);
                    setPhotoPreview(URL.createObjectURL(file));
                  }}
                />
                {photoName ? (
                  <>
                    <span className="min-w-0 flex-1 truncate rounded-lg border border-border bg-card px-3 py-2 text-sm">
                      {photoName}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
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
            <p className="mt-1.5 text-xs text-muted">Max 200 KB.</p>
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
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
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
            <Label htmlFor="nationality">Nationality</Label>
            <Input id="nationality" name="nationality" />
          </div>
          <div>
            <Label htmlFor="motherTongue">Language</Label>
            <Input id="motherTongue" name="motherTongue" />
          </div>
          <div>
            <Label htmlFor="idNumber">ID number</Label>
            <Input id="idNumber" name="idNumber" />
          </div>
          <div>
            <Label htmlFor="house">House</Label>
            <Input id="house" name="house" />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
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
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
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
          <h3 className="sm:col-span-2 text-lg font-semibold">Guardian</h3>
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
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
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
              <Input id="guardianRelationOther" name="guardianRelationOther" required />
            </div>
          ) : null}
          <div>
            <Label htmlFor="guardianPhone">Contact number 1</Label>
            <Input id="guardianPhone" name="guardianPhone" required />
          </div>
          <div>
            <Label htmlFor="guardianPhoneSecondary">Contact number 2</Label>
            <Input id="guardianPhoneSecondary" name="guardianPhoneSecondary" />
          </div>
          <div>
            <Label htmlFor="guardianEmail">Email</Label>
            <Input id="guardianEmail" name="guardianEmail" type="email" />
          </div>
          <div>
            <Label htmlFor="guardianOccupation">Occupation</Label>
            <Input id="guardianOccupation" name="guardianOccupation" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="guardianAddress">Guardian address</Label>
            <Input id="guardianAddress" name="guardianAddress" />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="canPickup" defaultChecked />
            Authorised to pick up the child
          </label>
        </section>

        {message ? <p className="text-sm text-success">{message}</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <Button type="submit" disabled={loading || !classId}>
          {loading ? "Saving…" : "Add student"}
        </Button>
      </form>
    </div>
  );
}
