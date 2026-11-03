-- Scope exam terms to a class (required going forward) and optional section

ALTER TABLE public.exam_terms
  ADD COLUMN class_id uuid REFERENCES public.classes(id) ON DELETE RESTRICT,
  ADD COLUMN section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL;

ALTER TABLE public.exam_terms
  DROP CONSTRAINT IF EXISTS exam_terms_school_id_academic_year_id_name_key;

CREATE UNIQUE INDEX exam_terms_scope_name_uniq
  ON public.exam_terms (
    school_id,
    academic_year_id,
    name,
    class_id,
    COALESCE(section_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

CREATE INDEX exam_terms_class_idx ON public.exam_terms(school_id, class_id);
