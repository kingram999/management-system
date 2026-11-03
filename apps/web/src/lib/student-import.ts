import type { ConcessionType } from "@/lib/academic-years";
import type { EnrolledStudentInput } from "@/lib/data/enrolled-student";

export const STUDENT_IMPORT_HEADERS = [
  "first_name",
  "last_name",
  "date_of_birth",
  "gender",
  "blood_group",
  "address",
  "city",
  "state",
  "pincode",
  "nationality",
  "mother_tongue",
  "id_number",
  "house",
  "category",
  "remarks",
  "status",
  "registration_number",
  "academic_year",
  "class_name",
  "section_name",
  "roll_number",
  "father_name",
  "mother_name",
  "guardian_name",
  "guardian_relation",
  "guardian_relation_other",
  "guardian_phone",
  "guardian_phone_secondary",
  "guardian_email",
  "guardian_address",
  "guardian_occupation",
  "fee_amount",
  "concession_type",
  "concession_value",
] as const;

export function studentImportTemplateCsv(): string {
  return `${STUDENT_IMPORT_HEADERS.join(",")}\n`;
}

export type ClassLookup = {
  id: string;
  name: string;
  academic_year_id: string;
  annual_fee: number;
  sections: Array<{ id: string; name: string }>;
};

export type YearLookup = { id: string; name: string };

function cell(
  row: Record<string, unknown>,
  key: string,
): string {
  const value = row[key] ?? row[key.toUpperCase()] ?? "";
  return String(value ?? "").trim();
}

export function mapImportRow(
  row: Record<string, unknown>,
  years: YearLookup[],
  classes: ClassLookup[],
  schoolId: string,
  profileId: string,
): EnrolledStudentInput {
  const yearName = cell(row, "academic_year");
  const className = cell(row, "class_name");
  const sectionName = cell(row, "section_name");

  const year =
    years.find((item) => item.name === yearName) ||
    years.find((item) => item.name.toLowerCase() === yearName.toLowerCase()) ||
    years[0];

  const schoolClass =
    classes.find(
      (item) =>
        item.name.toLowerCase() === className.toLowerCase() &&
        (!year || item.academic_year_id === year.id),
    ) ||
    classes.find(
      (item) => item.name.toLowerCase() === className.toLowerCase(),
    );

  if (!schoolClass) {
    throw new Error(`Unknown class "${className || "(empty)"}".`);
  }

  const section = sectionName
    ? schoolClass.sections.find(
        (item) => item.name.toLowerCase() === sectionName.toLowerCase(),
      )
    : null;

  const concessionTypeRaw = cell(row, "concession_type").toUpperCase();
  const concessionType = (
    concessionTypeRaw === "PERCENT" || concessionTypeRaw === "AMOUNT"
      ? concessionTypeRaw
      : ""
  ) as ConcessionType | "";

  const feeRaw = cell(row, "fee_amount");
  const concRaw = cell(row, "concession_value");

  return {
    schoolId,
    profileId,
    academicYearId: year?.id || schoolClass.academic_year_id,
    classId: schoolClass.id,
    sectionId: section?.id ?? null,
    rollNumber: cell(row, "roll_number") || null,
    registrationNumber: cell(row, "registration_number") || null,
    firstName: cell(row, "first_name"),
    lastName: cell(row, "last_name"),
    dateOfBirth: cell(row, "date_of_birth"),
    gender: (cell(row, "gender") || "MALE").toUpperCase(),
    bloodGroup: cell(row, "blood_group") || null,
    address: cell(row, "address") || null,
    city: cell(row, "city") || null,
    state: cell(row, "state") || null,
    pincode: cell(row, "pincode") || null,
    nationality: cell(row, "nationality") || null,
    motherTongue: cell(row, "mother_tongue") || null,
    idNumber: cell(row, "id_number") || null,
    house: cell(row, "house") || null,
    category: cell(row, "category") || null,
    remarks: cell(row, "remarks") || null,
    status: (cell(row, "status") || "ACTIVE").toUpperCase(),
    fatherName: cell(row, "father_name"),
    motherName: cell(row, "mother_name"),
    guardianName: cell(row, "guardian_name"),
    guardianRelation: (cell(row, "guardian_relation") || "FATHER").toUpperCase(),
    guardianRelationOther: cell(row, "guardian_relation_other") || null,
    guardianPhone: cell(row, "guardian_phone"),
    guardianPhoneSecondary: cell(row, "guardian_phone_secondary") || null,
    guardianEmail: cell(row, "guardian_email") || null,
    guardianAddress: cell(row, "guardian_address") || null,
    guardianOccupation: cell(row, "guardian_occupation") || null,
    canPickup: true,
    feeAmount: feeRaw ? Number(feeRaw) : schoolClass.annual_fee,
    concessionType,
    concessionValue: concRaw ? Number(concRaw) : null,
    photo: null,
  };
}

export function parseCsvText(text: string): Record<string, unknown>[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
