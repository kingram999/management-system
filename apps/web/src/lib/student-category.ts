export const STUDENT_CATEGORIES = [
  { value: "GENERAL", label: "General" },
  { value: "OBC", label: "OBC" },
  { value: "SC", label: "SC" },
  { value: "ST", label: "ST" },
  { value: "EWS", label: "EWS" },
  { value: "OTHER", label: "Other" },
] as const;

export type StudentCategory = (typeof STUDENT_CATEGORIES)[number]["value"];

export function studentCategoryLabel(value: string | null | undefined) {
  if (!value) return "";
  return (
    STUDENT_CATEGORIES.find((item) => item.value === value)?.label ?? value
  );
}
