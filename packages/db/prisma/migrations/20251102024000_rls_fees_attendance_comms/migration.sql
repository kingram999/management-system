-- fee_payments
CREATE POLICY fee_payments_select ON public.fee_payments
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY fee_payments_write ON public.fee_payments
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());

-- attendance_records
CREATE POLICY attendance_records_select ON public.attendance_records
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY attendance_records_write ON public.attendance_records
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());

-- communication_messages
CREATE POLICY communication_messages_select ON public.communication_messages
  FOR SELECT TO authenticated
  USING (school_id = public.current_profile_school_id());

CREATE POLICY communication_messages_write ON public.communication_messages
  FOR ALL TO authenticated
  USING (public.is_school_admin() AND school_id = public.current_profile_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.current_profile_school_id());

-- communication_message_recipients
CREATE POLICY communication_message_recipients_select ON public.communication_message_recipients
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.communication_messages m
      WHERE m.id = message_id
        AND m.school_id = public.current_profile_school_id()
    )
  );

CREATE POLICY communication_message_recipients_write ON public.communication_message_recipients
  FOR ALL TO authenticated
  USING (
    public.is_school_admin()
    AND EXISTS (
      SELECT 1 FROM public.communication_messages m
      WHERE m.id = message_id
        AND m.school_id = public.current_profile_school_id()
    )
  )
  WITH CHECK (
    public.is_school_admin()
    AND EXISTS (
      SELECT 1 FROM public.communication_messages m
      WHERE m.id = message_id
        AND m.school_id = public.current_profile_school_id()
    )
  );
