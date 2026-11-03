CREATE TYPE public.attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'LEAVE');

CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  attendance_date date NOT NULL,
  status public.attendance_status NOT NULL,
  marked_by_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, attendance_date)
);

CREATE INDEX attendance_records_school_date_class_idx
  ON public.attendance_records(school_id, attendance_date, class_id);
