/** Round to nearest 0.5 (e.g. 72.3 → 72.5, 72.2 → 72). */
export function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}
