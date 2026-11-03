CREATE TYPE public.fee_payment_method AS ENUM ('CASH', 'UPI', 'BANK', 'OTHER');

CREATE TABLE public.fee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0),
  method public.fee_payment_method NOT NULL,
  paid_at timestamptz NOT NULL,
  receipt_number text NOT NULL,
  note text,
  recorded_by_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, receipt_number)
);

CREATE INDEX fee_payments_school_paid_at_idx ON public.fee_payments(school_id, paid_at DESC);
CREATE INDEX fee_payments_student_idx ON public.fee_payments(student_id);
