import { createClient } from "@/lib/supabase/server";

export type TransportMode = "PICKUP" | "DROP" | "BOTH";

export type TransportRouteRecord = {
  id: string;
  name: string;
  code: string | null;
  annual_fee: number;
  is_active: boolean;
  stop_count: number;
  rider_count: number;
};

export type TransportStopRecord = {
  id: string;
  route_id: string;
  name: string;
  sequence: number;
  pickup_time: string | null;
  rider_count: number;
};

export type StudentTransportAssignment = {
  id: string;
  student_id: string;
  route_id: string;
  stop_id: string;
  mode: TransportMode;
  is_active: boolean;
  route_name: string;
  stop_name: string;
};

export type TransportOverview = {
  routes: number;
  stops: number;
  riders: number;
};

export type TransportStudentRow = {
  student_id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  class_id: string | null;
  class_name: string | null;
  section_name: string | null;
  assignment: StudentTransportAssignment | null;
};

export async function getTransportOverview(
  schoolId: string,
): Promise<TransportOverview> {
  const supabase = await createClient();

  const [routesRes, stopsRes, ridersRes] = await Promise.all([
    supabase
      .from("transport_routes")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .is("deleted_at", null),
    supabase
      .from("transport_stops")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .is("deleted_at", null),
    supabase
      .from("student_transport")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("is_active", true),
  ]);

  if (routesRes.error) throw new Error(routesRes.error.message);
  if (stopsRes.error) throw new Error(stopsRes.error.message);
  if (ridersRes.error) throw new Error(ridersRes.error.message);

  return {
    routes: routesRes.count ?? 0,
    stops: stopsRes.count ?? 0,
    riders: ridersRes.count ?? 0,
  };
}

export async function listTransportRoutes(
  schoolId: string,
): Promise<TransportRouteRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transport_routes")
    .select(
      `
      id, name, code, annual_fee, is_active,
      stops:transport_stops(id, deleted_at),
      riders:student_transport(id, is_active)
    `,
    )
    .eq("school_id", schoolId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((route) => {
    const stops = (route.stops ?? []) as Array<{
      id: string;
      deleted_at: string | null;
    }>;
    const riders = (route.riders ?? []) as Array<{
      id: string;
      is_active: boolean;
    }>;
    return {
      id: route.id,
      name: route.name,
      code: route.code,
      annual_fee: route.annual_fee,
      is_active: route.is_active,
      stop_count: stops.filter((s) => !s.deleted_at).length,
      rider_count: riders.filter((r) => r.is_active).length,
    };
  });
}

export async function listStopsForRoute(
  schoolId: string,
  routeId: string,
): Promise<TransportStopRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transport_stops")
    .select(
      `
      id, route_id, name, sequence, pickup_time,
      riders:student_transport(id, is_active)
    `,
    )
    .eq("school_id", schoolId)
    .eq("route_id", routeId)
    .is("deleted_at", null)
    .order("sequence", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((stop) => {
    const riders = (stop.riders ?? []) as Array<{
      id: string;
      is_active: boolean;
    }>;
    return {
      id: stop.id,
      route_id: stop.route_id,
      name: stop.name,
      sequence: stop.sequence,
      pickup_time: stop.pickup_time,
      rider_count: riders.filter((r) => r.is_active).length,
    };
  });
}

export async function listAllActiveStops(
  schoolId: string,
): Promise<TransportStopRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transport_stops")
    .select(
      `
      id, route_id, name, sequence, pickup_time,
      riders:student_transport(id, is_active)
    `,
    )
    .eq("school_id", schoolId)
    .is("deleted_at", null)
    .order("sequence", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((stop) => {
    const riders = (stop.riders ?? []) as Array<{
      id: string;
      is_active: boolean;
    }>;
    return {
      id: stop.id,
      route_id: stop.route_id,
      name: stop.name,
      sequence: stop.sequence,
      pickup_time: stop.pickup_time,
      rider_count: riders.filter((r) => r.is_active).length,
    };
  });
}

export async function createTransportRoute(input: {
  schoolId: string;
  name: string;
  code?: string | null;
  annualFee?: number;
  isActive?: boolean;
}): Promise<{ id: string }> {
  const name = input.name.trim();
  if (!name) throw new Error("Route name is required.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transport_routes")
    .insert({
      school_id: input.schoolId,
      name,
      code: input.code?.trim() || null,
      annual_fee: Math.max(0, Math.round(input.annualFee ?? 0)),
      is_active: input.isActive ?? true,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("A route with this name already exists.");
    }
    throw new Error(error?.message || "Could not create route.");
  }
  return data;
}

export async function updateTransportRoute(input: {
  schoolId: string;
  id: string;
  name: string;
  code?: string | null;
  annualFee?: number;
  isActive?: boolean;
}): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error("Route name is required.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("transport_routes")
    .update({
      name,
      code: input.code?.trim() || null,
      annual_fee: Math.max(0, Math.round(input.annualFee ?? 0)),
      is_active: input.isActive ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("school_id", input.schoolId)
    .is("deleted_at", null);

  if (error) {
    if (error.code === "23505") {
      throw new Error("A route with this name already exists.");
    }
    throw new Error(error.message);
  }
}

export async function softDeleteTransportRoute(
  schoolId: string,
  id: string,
): Promise<void> {
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("student_transport")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("route_id", id)
    .eq("is_active", true);

  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) {
    throw new Error(
      "This route still has assigned students. Clear assignments or deactivate the route instead.",
    );
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("transport_routes")
    .update({ deleted_at: now, is_active: false, updated_at: now })
    .eq("id", id)
    .eq("school_id", schoolId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  await supabase
    .from("transport_stops")
    .update({ deleted_at: now, updated_at: now })
    .eq("route_id", id)
    .eq("school_id", schoolId)
    .is("deleted_at", null);
}

export async function createTransportStop(input: {
  schoolId: string;
  routeId: string;
  name: string;
  sequence?: number;
  pickupTime?: string | null;
}): Promise<{ id: string }> {
  const name = input.name.trim();
  if (!name) throw new Error("Stop name is required.");

  const supabase = await createClient();
  const { data: route, error: routeError } = await supabase
    .from("transport_routes")
    .select("id")
    .eq("id", input.routeId)
    .eq("school_id", input.schoolId)
    .is("deleted_at", null)
    .maybeSingle();

  if (routeError) throw new Error(routeError.message);
  if (!route) throw new Error("Route not found.");

  const { data, error } = await supabase
    .from("transport_stops")
    .insert({
      school_id: input.schoolId,
      route_id: input.routeId,
      name,
      sequence: Math.max(0, Math.round(input.sequence ?? 0)),
      pickup_time: input.pickupTime?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("A stop with this name already exists on the route.");
    }
    throw new Error(error?.message || "Could not create stop.");
  }
  return data;
}

export async function updateTransportStop(input: {
  schoolId: string;
  id: string;
  name: string;
  sequence?: number;
  pickupTime?: string | null;
}): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error("Stop name is required.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("transport_stops")
    .update({
      name,
      sequence: Math.max(0, Math.round(input.sequence ?? 0)),
      pickup_time: input.pickupTime?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("school_id", input.schoolId)
    .is("deleted_at", null);

  if (error) {
    if (error.code === "23505") {
      throw new Error("A stop with this name already exists on the route.");
    }
    throw new Error(error.message);
  }
}

export async function softDeleteTransportStop(
  schoolId: string,
  id: string,
): Promise<void> {
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("student_transport")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("stop_id", id)
    .eq("is_active", true);

  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) {
    throw new Error(
      "This stop still has assigned students. Reassign them before deleting.",
    );
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("transport_stops")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", id)
    .eq("school_id", schoolId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
}

export async function getStudentTransport(
  schoolId: string,
  studentId: string,
): Promise<StudentTransportAssignment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_transport")
    .select(
      `
      id, student_id, route_id, stop_id, mode, is_active,
      route:transport_routes(name),
      stop:transport_stops(name)
    `,
    )
    .eq("school_id", schoolId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || !data.is_active) return null;

  const route = Array.isArray(data.route) ? data.route[0] : data.route;
  const stop = Array.isArray(data.stop) ? data.stop[0] : data.stop;

  return {
    id: data.id,
    student_id: data.student_id,
    route_id: data.route_id,
    stop_id: data.stop_id,
    mode: data.mode as TransportMode,
    is_active: data.is_active,
    route_name: route?.name ?? "",
    stop_name: stop?.name ?? "",
  };
}

export async function upsertStudentTransport(input: {
  schoolId: string;
  studentId: string;
  routeId: string;
  stopId: string;
  mode?: TransportMode;
}): Promise<void> {
  const mode = input.mode ?? "BOTH";
  if (!["PICKUP", "DROP", "BOTH"].includes(mode)) {
    throw new Error("Invalid transport mode.");
  }

  const supabase = await createClient();

  const { data: stop, error: stopError } = await supabase
    .from("transport_stops")
    .select("id, route_id")
    .eq("id", input.stopId)
    .eq("school_id", input.schoolId)
    .eq("route_id", input.routeId)
    .is("deleted_at", null)
    .maybeSingle();

  if (stopError) throw new Error(stopError.message);
  if (!stop) throw new Error("Stop must belong to the selected route.");

  const { data: route, error: routeError } = await supabase
    .from("transport_routes")
    .select("id, is_active")
    .eq("id", input.routeId)
    .eq("school_id", input.schoolId)
    .is("deleted_at", null)
    .maybeSingle();

  if (routeError) throw new Error(routeError.message);
  if (!route) throw new Error("Route not found.");
  if (!route.is_active) throw new Error("Cannot assign an inactive route.");

  const { data: existing, error: existingError } = await supabase
    .from("student_transport")
    .select("id")
    .eq("student_id", input.studentId)
    .eq("school_id", input.schoolId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  const payload = {
    school_id: input.schoolId,
    student_id: input.studentId,
    route_id: input.routeId,
    stop_id: input.stopId,
    mode,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from("student_transport")
      .update(payload)
      .eq("id", existing.id)
      .eq("school_id", input.schoolId);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("student_transport").insert(payload);
  if (error) throw new Error(error.message);
}

export async function clearStudentTransport(
  schoolId: string,
  studentId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("student_transport")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("school_id", schoolId)
    .eq("student_id", studentId);

  if (error) throw new Error(error.message);
}

export async function listStudentsForTransport(
  schoolId: string,
): Promise<TransportStudentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id, admission_number, first_name, last_name, status,
      enrollments:student_enrollments(
        class_id,
        class:classes(id, name),
        section:sections(id, name),
        academic_year:academic_years(is_current)
      ),
      transport:student_transport(
        id, student_id, route_id, stop_id, mode, is_active,
        route:transport_routes(name),
        stop:transport_stops(name)
      )
    `,
    )
    .eq("school_id", schoolId)
    .eq("status", "ACTIVE")
    .order("last_name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((student) => {
    const enrollments = (student.enrollments ?? []) as Array<{
      class_id: string;
      class: { id: string; name: string } | { id: string; name: string }[] | null;
      section:
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null;
      academic_year:
        | { is_current: boolean }
        | { is_current: boolean }[]
        | null;
    }>;

    const current =
      enrollments.find((item) => {
        const year = Array.isArray(item.academic_year)
          ? item.academic_year[0]
          : item.academic_year;
        return year?.is_current;
      }) ?? enrollments[0];

    const schoolClass = current
      ? Array.isArray(current.class)
        ? current.class[0]
        : current.class
      : null;
    const section = current
      ? Array.isArray(current.section)
        ? current.section[0]
        : current.section
      : null;

    const transportRaw = student.transport as
      | {
          id: string;
          student_id: string;
          route_id: string;
          stop_id: string;
          mode: TransportMode;
          is_active: boolean;
          route: { name: string } | { name: string }[] | null;
          stop: { name: string } | { name: string }[] | null;
        }
      | {
          id: string;
          student_id: string;
          route_id: string;
          stop_id: string;
          mode: TransportMode;
          is_active: boolean;
          route: { name: string } | { name: string }[] | null;
          stop: { name: string } | { name: string }[] | null;
        }[]
      | null;

    const transport = Array.isArray(transportRaw)
      ? transportRaw[0]
      : transportRaw;

    let assignment: StudentTransportAssignment | null = null;
    if (transport?.is_active) {
      const route = Array.isArray(transport.route)
        ? transport.route[0]
        : transport.route;
      const stop = Array.isArray(transport.stop)
        ? transport.stop[0]
        : transport.stop;
      assignment = {
        id: transport.id,
        student_id: transport.student_id,
        route_id: transport.route_id,
        stop_id: transport.stop_id,
        mode: transport.mode,
        is_active: transport.is_active,
        route_name: route?.name ?? "",
        stop_name: stop?.name ?? "",
      };
    }

    return {
      student_id: student.id,
      admission_number: student.admission_number,
      first_name: student.first_name,
      last_name: student.last_name,
      class_id: schoolClass?.id ?? current?.class_id ?? null,
      class_name: schoolClass?.name ?? null,
      section_name: section?.name ?? null,
      assignment,
    };
  });
}
