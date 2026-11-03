import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getStudentProfile } from "@/lib/data/students";
import {
  listAllActiveStops,
  listTransportRoutes,
} from "@/lib/data/transport";
import { StudentProfileClient } from "./student-profile-client";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireAdmin();
  const [student, routes, stops] = await Promise.all([
    getStudentProfile(profile.school_id, id),
    listTransportRoutes(profile.school_id),
    listAllActiveStops(profile.school_id),
  ]);

  if (!student) {
    notFound();
  }

  return (
    <div>
      <Link href="/admin/students" className="text-sm text-brand">
        ← Back to directory
      </Link>
      <StudentProfileClient
        student={student}
        routes={routes.filter((r) => r.is_active)}
        stops={stops}
      />
    </div>
  );
}
