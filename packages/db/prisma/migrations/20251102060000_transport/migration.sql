CREATE TYPE public.transport_mode AS ENUM ('PICKUP', 'DROP', 'BOTH');

CREATE TABLE public.transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  annual_fee integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX transport_routes_school_idx ON public.transport_routes(school_id);
CREATE UNIQUE INDEX transport_routes_active_name_uniq
  ON public.transport_routes(school_id, lower(name))
  WHERE deleted_at IS NULL;

CREATE TABLE public.transport_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  name text NOT NULL,
  sequence integer NOT NULL DEFAULT 0,
  pickup_time text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX transport_stops_school_route_idx ON public.transport_stops(school_id, route_id);
CREATE UNIQUE INDEX transport_stops_active_name_uniq
  ON public.transport_stops(route_id, lower(name))
  WHERE deleted_at IS NULL;

CREATE TABLE public.student_transport (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.transport_routes(id) ON DELETE RESTRICT,
  stop_id uuid NOT NULL REFERENCES public.transport_stops(id) ON DELETE RESTRICT,
  mode public.transport_mode NOT NULL DEFAULT 'BOTH',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id)
);

CREATE INDEX student_transport_school_route_idx ON public.student_transport(school_id, route_id);

ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_transport ENABLE ROW LEVEL SECURITY;

CREATE POLICY transport_routes_select ON public.transport_routes
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY transport_routes_write ON public.transport_routes
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());

CREATE POLICY transport_stops_select ON public.transport_stops
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY transport_stops_write ON public.transport_stops
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());

CREATE POLICY student_transport_select ON public.student_transport
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY student_transport_write ON public.student_transport
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());
