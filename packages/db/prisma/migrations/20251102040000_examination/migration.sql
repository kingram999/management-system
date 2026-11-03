-- Examination module: subjects, exam terms, exam subjects, marks

CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX subjects_school_idx ON public.subjects(school_id);
CREATE UNIQUE INDEX subjects_active_name_uniq
  ON public.subjects(school_id, lower(name))
  WHERE deleted_at IS NULL;

CREATE TABLE public.exam_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  name text NOT NULL,
  start_date date,
  end_date date,
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, academic_year_id, name)
);

CREATE INDEX exam_terms_school_year_idx ON public.exam_terms(school_id, academic_year_id);

CREATE TABLE public.exam_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  exam_term_id uuid NOT NULL REFERENCES public.exam_terms(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  max_marks numeric(8, 2) NOT NULL,
  pass_marks numeric(8, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_term_id, subject_id, class_id),
  CHECK (max_marks > 0),
  CHECK (pass_marks >= 0 AND pass_marks <= max_marks)
);

CREATE INDEX exam_subjects_school_term_class_idx
  ON public.exam_subjects(school_id, exam_term_id, class_id);

CREATE TABLE public.exam_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  exam_subject_id uuid NOT NULL REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  marks_obtained numeric(8, 2),
  is_absent boolean NOT NULL DEFAULT false,
  entered_by_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_subject_id, student_id),
  CHECK (
    (is_absent = true AND marks_obtained IS NULL)
    OR (is_absent = false AND marks_obtained IS NOT NULL AND marks_obtained >= 0)
  )
);

CREATE INDEX exam_marks_school_subject_idx ON public.exam_marks(school_id, exam_subject_id);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY subjects_select ON public.subjects
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY subjects_write ON public.subjects
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());

CREATE POLICY exam_terms_select ON public.exam_terms
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY exam_terms_write ON public.exam_terms
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());

CREATE POLICY exam_subjects_select ON public.exam_subjects
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY exam_subjects_write ON public.exam_subjects
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());

CREATE POLICY exam_marks_select ON public.exam_marks
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY exam_marks_write ON public.exam_marks
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());
