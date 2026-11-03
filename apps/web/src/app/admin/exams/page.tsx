import { requireAdmin } from "@/lib/auth";
import { listActiveClasses } from "@/lib/data/classes";
import { listExamSubjects, listExamTerms } from "@/lib/data/exams";
import { getCurrentAcademicYear } from "@/lib/data/school";
import { listSubjects } from "@/lib/data/subjects";
import { ExamsClient } from "./exams-client";

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ termId?: string }>;
}) {
  const profile = await requireAdmin();
  const params = await searchParams;
  const year = await getCurrentAcademicYear(profile.school_id);

  if (!year) {
    return (
      <div>
        <h2 className="display-font text-3xl">Exams</h2>
        <p className="mt-2 text-sm text-muted">
          Set a current academic year in Settings before creating exams.
        </p>
      </div>
    );
  }

  const [terms, subjects, classes] = await Promise.all([
    listExamTerms(profile.school_id, year.id),
    listSubjects(profile.school_id),
    listActiveClasses(profile.school_id),
  ]);

  const selectedTermId =
    params.termId && terms.some((t) => t.id === params.termId)
      ? params.termId
      : (terms[0]?.id ?? "");

  const examSubjects = selectedTermId
    ? await listExamSubjects(profile.school_id, selectedTermId)
    : [];

  return (
    <ExamsClient
      academicYearId={year.id}
      yearName={year.name}
      terms={terms}
      subjects={subjects}
      classes={classes.map((c) => ({
        id: c.id,
        name: c.name,
        sections: c.sections.map((s) => ({ id: s.id, name: s.name })),
      }))}
      selectedTermId={selectedTermId}
      examSubjects={examSubjects}
    />
  );
}
