import { requireAdmin } from "@/lib/auth";
import { listActiveClasses } from "@/lib/data/classes";
import { getSchoolById } from "@/lib/data/school";
import { listStudentsForDirectory } from "@/lib/data/students";
import { AssignSectionsClient } from "./assign-sections-client";

export default async function AssignSectionsPage() {
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
    <AssignSectionsClient
      students={students}
      classes={classOptions}
      sectionRule={school.section_assignment_rule || "RANDOM"}
    />
  );
}
