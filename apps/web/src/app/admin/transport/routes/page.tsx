import { requireAdmin } from "@/lib/auth";
import {
  listAllActiveStops,
  listTransportRoutes,
} from "@/lib/data/transport";
import { TransportRoutesClient } from "./routes-client";

export default async function TransportRoutesPage() {
  const profile = await requireAdmin();
  const [routes, stops] = await Promise.all([
    listTransportRoutes(profile.school_id),
    listAllActiveStops(profile.school_id),
  ]);

  return <TransportRoutesClient routes={routes} stops={stops} />;
}
