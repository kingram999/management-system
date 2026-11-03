CREATE TYPE public.employee_category AS ENUM ('TEACHER', 'STAFF', 'OTHER');
CREATE TYPE public.employee_status AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED');

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_code text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  gender public.gender,
  date_of_birth date,
  phone text,
  email text,
  address text,
  category public.employee_category NOT NULL DEFAULT 'STAFF',
  designation text NOT NULL,
  department text,
  joined_on date,
  status public.employee_status NOT NULL DEFAULT 'ACTIVE',
  monthly_salary integer NOT NULL DEFAULT 0,
  profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX employees_school_status_idx ON public.employees(school_id, status);
CREATE INDEX employees_school_category_idx ON public.employees(school_id, category);
CREATE UNIQUE INDEX employees_active_code_uniq
  ON public.employees(school_id, lower(employee_code))
  WHERE deleted_at IS NULL AND employee_code IS NOT NULL;

CREATE TABLE public.employee_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status public.attendance_status NOT NULL,
  marked_by_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, attendance_date)
);

CREATE INDEX employee_attendance_school_date_idx
  ON public.employee_attendance(school_id, attendance_date);

CREATE TABLE public.employee_salary_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  paid_on date NOT NULL,
  period_label text,
  method text,
  note text,
  recorded_by_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX employee_salary_payments_school_paid_idx
  ON public.employee_salary_payments(school_id, paid_on);
CREATE INDEX employee_salary_payments_school_employee_idx
  ON public.employee_salary_payments(school_id, employee_id);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_salary_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY employees_select ON public.employees
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY employees_write ON public.employees
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());

CREATE POLICY employee_attendance_select ON public.employee_attendance
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY employee_attendance_write ON public.employee_attendance
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());

CREATE POLICY employee_salary_payments_select ON public.employee_salary_payments
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY employee_salary_payments_write ON public.employee_salary_payments
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());
