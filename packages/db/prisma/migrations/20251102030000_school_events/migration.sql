CREATE TYPE public.school_event_type AS ENUM ('MEETING', 'EVENT', 'OTHER');

CREATE TABLE public.school_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  event_date date NOT NULL,
  start_time text,
  end_time text,
  event_type public.school_event_type NOT NULL DEFAULT 'EVENT',
  notes text,
  created_by_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX school_events_school_date_idx ON public.school_events(school_id, event_date);

ALTER TABLE public.school_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY school_events_select ON public.school_events
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY school_events_write ON public.school_events
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());
