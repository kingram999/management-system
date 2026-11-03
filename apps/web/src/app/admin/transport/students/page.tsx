import { requireAdmin } from "@/lib/auth";
import { listActiveClasses } from "@/lib/data/classes";
import {
  listAllActiveStops,
  listStudentsForTransport,
  listTransportRoutes,
} from "@/lib/data/transport";
import { TransportStudentsClient } from "./students-client";

export default async function TransportStudentsPage() {
  const profile = await requireAdmin();
  const [students, routes, stops, classes] = await Promise.all([
    listStudentsForTransport(profile.school_id),
    listTransportRoutes(profile.school_id),
    listAllActiveStops(profile.school_id),
    listActiveClasses(profile.school_id),
  ]);

  return (
    <TransportStudentsClient
      students={students}
      routes={routes.filter((r) => r.is_active)}
      stops={stops}
      classes={classes.map((c) => ({
        id: c.id,
        name: c.name,
        sections: c.sections.map((s) => ({ id: s.id, name: s.name })),
      }))}
    />
  );
}
