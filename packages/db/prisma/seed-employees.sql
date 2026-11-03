-- Sample employees, today's attendance, and a few salary payments.
-- Safe to re-run: skips existing employee codes; upserts today's attendance.

WITH school AS (
  SELECT id AS school_id FROM public.schools LIMIT 1
),
admin AS (
  SELECT p.id AS profile_id
  FROM public.profiles p
  WHERE p.role = 'ADMIN'
  LIMIT 1
),
ins_employees AS (
  INSERT INTO public.employees (
    school_id, employee_code, first_name, last_name, gender, date_of_birth,
    phone, email, category, designation, department, joined_on, status, monthly_salary
  )
  SELECT
    s.school_id,
    v.code,
    v.first_name,
    v.last_name,
    v.gender::public.gender,
    v.dob::date,
    v.phone,
    v.email,
    v.category::public.employee_category,
    v.designation,
    v.department,
    v.joined_on::date,
    'ACTIVE'::public.employee_status,
    v.salary
  FROM school s
  CROSS JOIN (
    VALUES
      ('EMP-001', 'Ananya', 'Sharma', 'FEMALE', to_char(current_date, 'YYYY') || '-03-12', '9876500001', 'ananya.sharma@rsps.local', 'TEACHER', 'Class Teacher', 'Primary', '2019-06-01', 28000),
      ('EMP-002', 'Ravi', 'Patel', 'MALE', to_char(current_date, 'YYYY') || '-' || to_char(current_date, 'MM-DD'), '9876500002', 'ravi.patel@rsps.local', 'TEACHER', 'Math Teacher', 'Secondary', '2018-04-15', 32000),
      ('EMP-003', 'Meera', 'Iyer', 'FEMALE', '1988-11-02', '9876500003', 'meera.iyer@rsps.local', 'TEACHER', 'Science Teacher', 'Secondary', '2020-07-01', 30000),
      ('EMP-004', 'Suresh', 'Nair', 'MALE', '1985-01-20', '9876500004', 'suresh.nair@rsps.local', 'TEACHER', 'English Teacher', 'Secondary', '2017-06-10', 29000),
      ('EMP-005', 'Kavita', 'Reddy', 'FEMALE', '1992-08-08', '9876500005', 'kavita.reddy@rsps.local', 'TEACHER', 'Kindergarten Teacher', 'Primary', '2021-06-01', 25000),
      ('EMP-006', 'Arjun', 'Das', 'MALE', '1990-05-14', '9876500006', 'arjun.das@rsps.local', 'STAFF', 'Accountant', 'Accounts', '2016-03-01', 27000),
      ('EMP-007', 'Priya', 'Singh', 'FEMALE', '1994-09-30', '9876500007', 'priya.singh@rsps.local', 'STAFF', 'Office Assistant', 'Admin', '2022-01-12', 18000),
      ('EMP-008', 'Imran', 'Khan', 'MALE', '1987-12-05', '9876500008', 'imran.khan@rsps.local', 'STAFF', 'Lab Assistant', 'Secondary', '2019-08-20', 16000),
      ('EMP-009', 'Lakshmi', 'Rao', 'FEMALE', '1991-04-18', '9876500009', 'lakshmi.rao@rsps.local', 'STAFF', 'Librarian', 'Library', '2015-07-01', 22000),
      ('EMP-010', 'Vikram', 'Joshi', 'MALE', '1983-02-28', '9876500010', 'vikram.joshi@rsps.local', 'OTHER', 'Security Supervisor', 'Facilities', '2014-05-01', 15000)
  ) AS v(code, first_name, last_name, gender, dob, phone, email, category, designation, department, joined_on, salary)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.school_id = s.school_id
      AND e.employee_code = v.code
      AND e.deleted_at IS NULL
  )
  RETURNING id
),
all_emps AS (
  SELECT e.id, e.school_id, e.employee_code, e.monthly_salary
  FROM public.employees e
  JOIN school s ON s.school_id = e.school_id
  WHERE e.deleted_at IS NULL
    AND e.employee_code LIKE 'EMP-%'
)
INSERT INTO public.employee_attendance (school_id, employee_id, attendance_date, status, marked_by_id)
SELECT ae.school_id, ae.id, current_date,
       CASE
         WHEN row_number() OVER (ORDER BY ae.employee_code) % 7 = 0 THEN 'LEAVE'::public.attendance_status
         WHEN row_number() OVER (ORDER BY ae.employee_code) % 5 = 0 THEN 'LATE'::public.attendance_status
         WHEN row_number() OVER (ORDER BY ae.employee_code) % 4 = 0 THEN 'ABSENT'::public.attendance_status
         ELSE 'PRESENT'::public.attendance_status
       END,
       a.profile_id
FROM all_emps ae
CROSS JOIN admin a
ON CONFLICT (employee_id, attendance_date) DO UPDATE
  SET status = EXCLUDED.status,
      marked_by_id = EXCLUDED.marked_by_id,
      updated_at = now();

WITH school AS (
  SELECT id AS school_id FROM public.schools LIMIT 1
),
admin AS (
  SELECT p.id AS profile_id
  FROM public.profiles p
  WHERE p.role = 'ADMIN'
  LIMIT 1
),
all_emps AS (
  SELECT e.id, e.school_id, e.employee_code, e.monthly_salary
  FROM public.employees e
  JOIN school s ON s.school_id = e.school_id
  WHERE e.deleted_at IS NULL
    AND e.employee_code IN ('EMP-001', 'EMP-002', 'EMP-006')
)
INSERT INTO public.employee_salary_payments (
  school_id, employee_id, amount, paid_on, period_label, method, note, recorded_by_id
)
SELECT ae.school_id, ae.id, ae.monthly_salary, date_trunc('month', current_date)::date,
       to_char(current_date, 'YYYY-MM'), 'BANK', 'Seed payment', a.profile_id
FROM all_emps ae
CROSS JOIN admin a
WHERE NOT EXISTS (
  SELECT 1 FROM public.employee_salary_payments p
  WHERE p.employee_id = ae.id
    AND p.period_label = to_char(current_date, 'YYYY-MM')
);
