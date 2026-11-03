import { requireAdmin } from "@/lib/auth";
import { listActiveClasses } from "@/lib/data/classes";
import { listExamTerms } from "@/lib/data/exams";
import { listMarksSheet } from "@/lib/data/marks";
import { getCurrentAcademicYear } from "@/lib/data/school";
import { listSubjects } from "@/lib/data/subjects";
import { MarksClient } from "./marks-client";

export default async function MarksPage({
  searchParams,
}: {
  searchParams: Promise<{
    termId?: string;
    classId?: string;
    sectionId?: string;
    subjectId?: string;
  }>;
}) {
  const profile = await requireAdmin();
  const params = await searchParams;
  const year = await getCurrentAcademicYear(profile.school_id);

  const [terms, subjects, classes] = await Promise.all([
    year
      ? listExamTerms(profile.school_id, year.id)
      : Promise.resolve([]),
    listSubjects(profile.school_id),
    listActiveClasses(profile.school_id),
  ]);

  const termId = params.termId || terms[0]?.id || "";
  const selectedTerm = terms.find((t) => t.id === termId) ?? null;
  const classId =
    params.classId || selectedTerm?.class_id || "";
  const sectionId =
    params.sectionId || selectedTerm?.section_id || "";
  const subjectId = params.subjectId || "";

  const sheet =
    termId && classId && subjectId
      ? await listMarksSheet({
          schoolId: profile.school_id,
          examTermId: termId,
          classId,
          sectionId: sectionId || null,
          subjectId,
        })
      : null;

  return (
    <MarksClient
      terms={terms}
      subjects={subjects}
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
      initialSubjectId={subjectId}
      sheet={sheet}
    />
  );
}
