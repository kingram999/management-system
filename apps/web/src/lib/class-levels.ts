export type ClassLevel = {
  name: string;
  numericLevel: number;
};

/** Nursery → Class 12 (Indian school levels). */
export const CLASS_LEVELS: ClassLevel[] = [
  { name: "Nursery", numericLevel: -2 },
  { name: "LKG", numericLevel: -1 },
  { name: "UKG", numericLevel: 0 },
  { name: "Class 1", numericLevel: 1 },
  { name: "Class 2", numericLevel: 2 },
  { name: "Class 3", numericLevel: 3 },
  { name: "Class 4", numericLevel: 4 },
  { name: "Class 5", numericLevel: 5 },
  { name: "Class 6", numericLevel: 6 },
  { name: "Class 7", numericLevel: 7 },
  { name: "Class 8", numericLevel: 8 },
  { name: "Class 9", numericLevel: 9 },
  { name: "Class 10", numericLevel: 10 },
  { name: "Class 11", numericLevel: 11 },
  { name: "Class 12", numericLevel: 12 },
];

export function levelsInRange(fromLevel: number, toLevel: number): ClassLevel[] {
  const low = Math.min(fromLevel, toLevel);
  const high = Math.max(fromLevel, toLevel);
  return CLASS_LEVELS.filter(
    (level) => level.numericLevel >= low && level.numericLevel <= high,
  );
}

/** Nursery (−2) = ₹15,000; +₹5,000 per level above Nursery. */
export function defaultAnnualFee(numericLevel: number): number {
  return 15000 + (numericLevel + 2) * 5000;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const DEFAULT_SECTION_NAMES = ["A", "B", "C", "D", "E", "F"];
