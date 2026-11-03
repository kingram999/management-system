import { requireAdmin } from "@/lib/auth";
import { listActiveClasses } from "@/lib/data/classes";
import { listStudentFeeBalances } from "@/lib/data/fees";
import { FeeDuesClient } from "./dues-client";

export default async function FeeDuesPage() {
  const profile = await requireAdmin();
  const [rows, classes] = await Promise.all([
    listStudentFeeBalances(profile.school_id),
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

  return <FeeDuesClient rows={rows} classes={classOptions} />;
}
