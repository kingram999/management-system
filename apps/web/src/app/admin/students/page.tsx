import { requireAdmin } from "@/lib/auth";
import { listActiveClasses } from "@/lib/data/classes";
import { listStudentsForDirectory } from "@/lib/data/students";
import { StudentDirectory } from "./student-directory";

export default async function StudentsPage() {
  const profile = await requireAdmin();
  const [students, classes] = await Promise.all([
    listStudentsForDirectory(profile.school_id),
    listActiveClasses(profile.school_id),
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
    <StudentDirectory students={students} classes={classOptions} />
  );
}
