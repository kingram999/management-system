import { requireAdmin } from "@/lib/auth";
import { listAttendanceSheet } from "@/lib/data/attendance";
import { listActiveClasses } from "@/lib/data/classes";
import { AttendanceClient } from "./attendance-client";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    classId?: string;
    sectionId?: string;
  }>;
}) {
  const profile = await requireAdmin();
  const params = await searchParams;
  const date = params.date || new Date().toISOString().slice(0, 10);
  const classId = params.classId || "";
  const sectionId = params.sectionId || "";

  const [classes, sheet] = await Promise.all([
    listActiveClasses(profile.school_id),
    listAttendanceSheet({
      schoolId: profile.school_id,
      date,
      classId,
      sectionId: sectionId || null,
    }),
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
    <AttendanceClient
      classes={classOptions}
      initialDate={date}
      initialClassId={classId}
      initialSectionId={sectionId}
      initialRows={sheet.rows}
      lastMarkedByName={sheet.lastMarkedByName}
    />
  );
}
