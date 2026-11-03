import { requireAdmin } from "@/lib/auth";
import { listActiveClasses } from "@/lib/data/classes";
import { getSchoolById } from "@/lib/data/school";
import { listStudentsForDirectory } from "@/lib/data/students";
import { AssignRollNumbersClient } from "./assign-roll-numbers-client";

export default async function AssignRollNumbersPage() {
  const profile = await requireAdmin();
  const [students, classes, school] = await Promise.all([
    listStudentsForDirectory(profile.school_id),
    listActiveClasses(profile.school_id),
    getSchoolById(profile.school_id),
  ]);

  const classOptions = classes.map((item) => ({
    id: item.id,
    name: item.name,
    sections: item.sections.map((section) => ({
      id: section.id,
      name: section.name,
    })),
  }));

  return (
    <AssignRollNumbersClient
      students={students}
      classes={classOptions}
      rollRule={school.roll_number_assignment_rule || "ALPHABETICAL"}
    />
  );
}
