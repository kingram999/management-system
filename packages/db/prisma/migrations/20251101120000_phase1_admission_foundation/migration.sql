-- Phase 1: Foundation + Admission Management
-- Applied to Supabase via migration phase1_admission_foundation_schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.user_role AS ENUM ('ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'STAFF');
CREATE TYPE public.gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE public.admission_status AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WAITLISTED');
CREATE TYPE public.document_type AS ENUM ('BIRTH_CERTIFICATE', 'PHOTO', 'MARKSHEET', 'TRANSFER_CERTIFICATE', 'OTHER');
CREATE TYPE public.guardian_relation AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER');
CREATE TYPE public.student_status AS ENUM ('ACTIVE', 'INACTIVE', 'ALUMNI', 'TRANSFERRED');

CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  address text,
  city text,
  state text,
  pincode text,
  country text DEFAULT 'India',
  phone text,
  email text,
  website text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'ADMIN',
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profiles_school_id_idx ON public.profiles(school_id);

CREATE TABLE public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, name)
);
CREATE INDEX academic_years_school_current_idx ON public.academic_years(school_id, is_current);

CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name text NOT NULL,
  numeric_level integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, academic_year_id, name)
);
CREATE INDEX classes_academic_year_id_idx ON public.classes(academic_year_id);

CREATE TABLE public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, name)
);

CREATE TABLE public.admission_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  application_number text NOT NULL,
  status public.admission_status NOT NULL DEFAULT 'DRAFT',
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender public.gender NOT NULL,
  blood_group text,
  previous_school text,
  address text,
  city text,
  state text,
  pincode text,
  guardian_name text NOT NULL,
  guardian_relation public.guardian_relation NOT NULL,
  guardian_phone text NOT NULL,
  guardian_email text,
  guardian_address text,
  review_notes text,
  rejection_reason text,
  reviewed_by_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  student_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, application_number)
);
CREATE INDEX admission_applications_school_status_idx ON public.admission_applications(school_id, status);
CREATE INDEX admission_applications_school_year_idx ON public.admission_applications(school_id, academic_year_id);

CREATE TABLE public.admission_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.admission_applications(id) ON DELETE CASCADE,
  type public.document_type NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  mime_type text,
  size_bytes integer,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admission_documents_application_id_idx ON public.admission_documents(application_id);

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  admission_application_id uuid UNIQUE REFERENCES public.admission_applications(id) ON DELETE SET NULL,
  admission_number text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender public.gender NOT NULL,
  blood_group text,
  address text,
  city text,
  state text,
  pincode text,
  photo_url text,
  status public.student_status NOT NULL DEFAULT 'ACTIVE',
  admitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, admission_number)
);
CREATE INDEX students_school_status_idx ON public.students(school_id, status);

ALTER TABLE public.admission_applications
  ADD CONSTRAINT admission_applications_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;

CREATE TABLE public.student_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  roll_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, academic_year_id)
);
CREATE INDEX student_enrollments_year_class_idx ON public.student_enrollments(academic_year_id, class_id);

CREATE TABLE public.guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  relation public.guardian_relation NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX guardians_school_id_idx ON public.guardians(school_id);

CREATE TABLE public.student_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  guardian_id uuid NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, guardian_id)
);
