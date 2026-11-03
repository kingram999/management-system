import { requireAdmin } from "@/lib/auth";
import {
  isAssignmentRule,
  type AssignmentRule,
} from "@/lib/assignment-rules";
import { getSchoolById } from "@/lib/data/school";
import { AssignmentSettingsForm } from "./assignment-settings-form";

function asRule(value: string | null | undefined, fallback: AssignmentRule) {
  return value && isAssignmentRule(value) ? value : fallback;
}

export default async function AssignmentSettingsPage() {
  const profile = await requireAdmin();
  const school = await getSchoolById(profile.school_id);

  return (
    <AssignmentSettingsForm
      sectionAssignmentRule={asRule(school.section_assignment_rule, "RANDOM")}
      rollNumberAssignmentRule={asRule(
        school.roll_number_assignment_rule,
        "ALPHABETICAL",
      )}
    />
  );
}
