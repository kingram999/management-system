import { requireAdmin } from "@/lib/auth";
import { listActiveClasses } from "@/lib/data/classes";
import { listCommunicationMessages } from "@/lib/data/communication";
import { listStudentsForDirectory } from "@/lib/data/students";
import { CommunicationClient } from "./communication-client";

export default async function CommunicationPage() {
  const profile = await requireAdmin();
  const [students, classes, messages] = await Promise.all([
    listStudentsForDirectory(profile.school_id),
    listActiveClasses(profile.school_id),
    listCommunicationMessages(profile.school_id),
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
    <CommunicationClient
      students={students}
      classes={classOptions}
      messages={messages}
    />
  );
}
