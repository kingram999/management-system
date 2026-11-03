ALTER TABLE public.admission_applications
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS remarks text;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS remarks text;
