/** Indian school year label, e.g. 2026-27 */
export function academicYearLabel(startYear: number): string {
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

/** Current + next 5 years starting at 2026 (2026-27 … 2031-32). */
export const ADMISSION_YEAR_START = 2026;
export const ADMISSION_YEAR_COUNT = 6; // current + next 5

export function admissionYearWindow(startYear = ADMISSION_YEAR_START) {
  return Array.from({ length: ADMISSION_YEAR_COUNT }, (_, index) => {
    const year = startYear + index;
    return {
      startYear: year,
      name: academicYearLabel(year),
      startDate: `${year}-04-01`,
      endDate: `${year + 1}-03-31`,
      isCurrent: index === 0,
    };
  });
}

export type ConcessionType = "PERCENT" | "AMOUNT";

export function computeFinalFee(
  annualFee: number,
  concessionType: ConcessionType | "" | null,
  concessionValue: number,
): number {
  if (!concessionType || Number.isNaN(concessionValue) || concessionValue <= 0) {
    return Math.max(0, Math.round(annualFee));
  }

  if (concessionType === "PERCENT") {
    const pct = Math.min(100, Math.max(0, concessionValue));
    return Math.max(0, Math.round(annualFee * (1 - pct / 100)));
  }

  return Math.max(0, Math.round(annualFee - Math.max(0, concessionValue)));
}
