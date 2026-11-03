CREATE TYPE public.communication_audience_type AS ENUM ('SINGLE', 'GROUP');
CREATE TYPE public.communication_channel AS ENUM ('LOG');
CREATE TYPE public.communication_recipient_status AS ENUM ('RECORDED');

CREATE TABLE public.communication_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body text NOT NULL,
  audience_type public.communication_audience_type NOT NULL,
  filter_summary text,
  channel public.communication_channel NOT NULL DEFAULT 'LOG',
  sent_by_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX communication_messages_school_created_idx
  ON public.communication_messages(school_id, created_at DESC);

CREATE TABLE public.communication_message_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.communication_messages(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  guardian_id uuid REFERENCES public.guardians(id) ON DELETE SET NULL,
  student_name text NOT NULL,
  guardian_name text NOT NULL,
  guardian_phone text,
  guardian_email text,
  status public.communication_recipient_status NOT NULL DEFAULT 'RECORDED'
);

CREATE INDEX communication_message_recipients_message_idx
  ON public.communication_message_recipients(message_id);
CREATE INDEX communication_message_recipients_student_idx
  ON public.communication_message_recipients(student_id);
