export const ASSIGNMENT_RULES = [
  { value: "RANDOM", label: "Random" },
  { value: "ALPHABETICAL", label: "Alphabetically" },
  { value: "GENDER", label: "Gender" },
  { value: "AGE", label: "Age" },
  { value: "MARKS", label: "Marks" },
] as const;

export type AssignmentRule = (typeof ASSIGNMENT_RULES)[number]["value"];

export function isAssignmentRule(value: string): value is AssignmentRule {
  return ASSIGNMENT_RULES.some((rule) => rule.value === value);
}

export function assignmentRuleLabel(rule: string): string {
  return ASSIGNMENT_RULES.find((item) => item.value === rule)?.label ?? rule;
}

export type AssignableStudent = {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
};

const GENDER_ORDER = ["MALE", "FEMALE", "OTHER"];

function nameCompare(a: AssignableStudent, b: AssignableStudent) {
  const last = a.last_name.localeCompare(b.last_name, undefined, {
    sensitivity: "base",
  });
  if (last !== 0) return last;
  return a.first_name.localeCompare(b.first_name, undefined, {
    sensitivity: "base",
  });
}

function ageCompare(a: AssignableStudent, b: AssignableStudent) {
  // Older first (ascending DOB)
  const cmp = a.date_of_birth.localeCompare(b.date_of_birth);
  if (cmp !== 0) return cmp;
  return nameCompare(a, b);
}

function genderCompare(a: AssignableStudent, b: AssignableStudent) {
  const ai = GENDER_ORDER.indexOf(a.gender);
  const bi = GENDER_ORDER.indexOf(b.gender);
  const aRank = ai === -1 ? GENDER_ORDER.length : ai;
  const bRank = bi === -1 ? GENDER_ORDER.length : bi;
  if (aRank !== bRank) return aRank - bRank;
  return nameCompare(a, b);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function assertRuleSupported(rule: AssignmentRule) {
  if (rule === "MARKS") {
    throw new Error(
      "Marks-based assignment is not available yet. Change the rule in Assignment settings.",
    );
  }
}

export function sortStudentsByRule(
  students: AssignableStudent[],
  rule: AssignmentRule,
): AssignableStudent[] {
  assertRuleSupported(rule);
  const copy = [...students];
  switch (rule) {
    case "RANDOM":
      return shuffle(copy);
    case "ALPHABETICAL":
      return copy.sort(nameCompare);
    case "AGE":
      return copy.sort(ageCompare);
    case "GENDER":
      return copy.sort(genderCompare);
    default:
      return copy.sort(nameCompare);
  }
}

/** Round-robin distribution into sections (balanced sizes). */
export function distributeRoundRobin(
  studentIds: string[],
  sectionIds: string[],
): Map<string, string> {
  const result = new Map<string, string>();
  if (!sectionIds.length) return result;
  studentIds.forEach((studentId, index) => {
    result.set(studentId, sectionIds[index % sectionIds.length]);
  });
  return result;
}

/**
 * Balance gender counts across sections (and overall size as tie-break).
 * Within each gender, students are already sorted alphabetically by caller.
 */
export function distributeByGenderBalance(
  students: AssignableStudent[],
  sectionIds: string[],
): Map<string, string> {
  const result = new Map<string, string>();
  if (!sectionIds.length) return result;

  const totals = new Map(sectionIds.map((id) => [id, 0]));
  const byGender = new Map(
    sectionIds.map((id) => [id, new Map<string, number>()]),
  );

  for (const student of students) {
    let bestSection = sectionIds[0];
    let bestScore: [number, number] = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];

    for (const sectionId of sectionIds) {
      const genderCount =
        byGender.get(sectionId)?.get(student.gender) ?? 0;
      const total = totals.get(sectionId) ?? 0;
      const score: [number, number] = [genderCount, total];
      if (
        score[0] < bestScore[0] ||
        (score[0] === bestScore[0] && score[1] < bestScore[1])
      ) {
        bestScore = score;
        bestSection = sectionId;
      }
    }

    result.set(student.id, bestSection);
    totals.set(bestSection, (totals.get(bestSection) ?? 0) + 1);
    const genderMap = byGender.get(bestSection)!;
    genderMap.set(student.gender, (genderMap.get(student.gender) ?? 0) + 1);
  }

  return result;
}

export function assignStudentsToSections(
  students: AssignableStudent[],
  sectionIds: string[],
  rule: AssignmentRule,
): Map<string, string> {
  assertRuleSupported(rule);
  if (!sectionIds.length) {
    throw new Error("This class has no sections.");
  }

  if (rule === "GENDER") {
    const ordered = sortStudentsByRule(students, "GENDER");
    return distributeByGenderBalance(ordered, sectionIds);
  }

  const ordered = sortStudentsByRule(students, rule);
  return distributeRoundRobin(
    ordered.map((s) => s.id),
    sectionIds,
  );
}
