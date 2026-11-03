import { requireAdmin } from "@/lib/auth";
import { listActiveClasses } from "@/lib/data/classes";
import { listExamTerms } from "@/lib/data/exams";
import { listExamResults } from "@/lib/data/marks";
import { getCurrentAcademicYear } from "@/lib/data/school";
import { ResultsClient } from "./results-client";

export default async function ExamResultsPage({
  searchParams,
}: {
  searchParams: Promise<{
    termId?: string;
    classId?: string;
    sectionId?: string;
  }>;
}) {
  const profile = await requireAdmin();
  const params = await searchParams;
  const year = await getCurrentAcademicYear(profile.school_id);

  const [terms, classes] = await Promise.all([
    year
      ? listExamTerms(profile.school_id, year.id)
      : Promise.resolve([]),
    listActiveClasses(profile.school_id),
  ]);

  const termId = params.termId || terms[0]?.id || "";
  const selectedTerm = terms.find((t) => t.id === termId) ?? null;
  const classId =
    params.classId || selectedTerm?.class_id || "";
  const sectionId =
    params.sectionId || selectedTerm?.section_id || "";

  const results =
    termId && classId
      ? await listExamResults({
          schoolId: profile.school_id,
          examTermId: termId,
          classId,
          sectionId: sectionId || null,
        })
      : { subjects: [], rows: [] };

  return (
    <ResultsClient
      terms={terms}
      classes={classes.map((item) => ({
        id: item.id,
        name: item.name,
        sections: item.sections.map((section) => ({
          id: section.id,
          name: section.name,
        })),
      }))}
      initialTermId={termId}
      initialClassId={classId}
      initialSectionId={sectionId}
      subjects={results.subjects}
      rows={results.rows}
    />
  );
}
