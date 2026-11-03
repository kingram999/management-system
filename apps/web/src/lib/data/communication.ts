import { createClient } from "@/lib/supabase/server";

export type GuardianRecipient = {
  student_id: string;
  student_name: string;
  guardian_id: string;
  guardian_name: string;
  guardian_phone: string | null;
  guardian_email: string | null;
};

export type CommunicationMessageListItem = {
  id: string;
  subject: string;
  body: string;
  audience_type: "SINGLE" | "GROUP";
  filter_summary: string | null;
  channel: string;
  created_at: string;
  sender_name: string | null;
  recipient_count: number;
  recipients: Array<{
    id: string;
    student_name: string;
    guardian_name: string;
    guardian_phone: string | null;
    guardian_email: string | null;
    status: string;
  }>;
};

export async function listGuardiansForStudents(
  schoolId: string,
  studentIds: string[],
): Promise<GuardianRecipient[]> {
  if (!studentIds.length) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id, first_name, last_name, school_id,
      guardians:student_guardians(
        guardian:guardians(id, full_name, phone, email)
      )
    `,
    )
    .eq("school_id", schoolId)
    .in("id", studentIds);

  if (error) throw new Error(error.message);

  const recipients: GuardianRecipient[] = [];

  for (const student of data ?? []) {
    const links = (student.guardians ?? []) as Array<{
      guardian:
        | {
            id: string;
            full_name: string;
            phone: string | null;
            email: string | null;
          }
        | {
            id: string;
            full_name: string;
            phone: string | null;
            email: string | null;
          }[]
        | null;
    }>;

    for (const link of links) {
      const guardian = Array.isArray(link.guardian)
        ? link.guardian[0]
        : link.guardian;
      if (!guardian) continue;
      recipients.push({
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`.trim(),
        guardian_id: guardian.id,
        guardian_name: guardian.full_name,
        guardian_phone: guardian.phone,
        guardian_email: guardian.email,
      });
    }
  }

  return recipients;
}

export async function sendGuardianMessageLog(input: {
  schoolId: string;
  sentById: string;
  subject: string;
  body: string;
  audienceType: "SINGLE" | "GROUP";
  filterSummary: string | null;
  studentIds: string[];
}): Promise<{ messageId: string; recipientCount: number; studentCount: number }> {
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!subject) throw new Error("Subject is required.");
  if (!body) throw new Error("Message body is required.");

  const uniqueStudentIds = Array.from(new Set(input.studentIds));
  if (!uniqueStudentIds.length) {
    throw new Error("Select at least one student.");
  }

  const recipients = await listGuardiansForStudents(
    input.schoolId,
    uniqueStudentIds,
  );
  if (!recipients.length) {
    throw new Error("No guardians found for the selected students.");
  }

  const supabase = await createClient();
  const { data: message, error: messageError } = await supabase
    .from("communication_messages")
    .insert({
      school_id: input.schoolId,
      subject,
      body,
      audience_type: input.audienceType,
      filter_summary: input.filterSummary,
      channel: "LOG",
      sent_by_id: input.sentById,
    })
    .select("id")
    .single();

  if (messageError || !message) {
    throw new Error(messageError?.message || "Could not save message.");
  }

  const rows = recipients.map((recipient) => ({
    message_id: message.id,
    student_id: recipient.student_id,
    guardian_id: recipient.guardian_id,
    student_name: recipient.student_name,
    guardian_name: recipient.guardian_name,
    guardian_phone: recipient.guardian_phone,
    guardian_email: recipient.guardian_email,
    status: "RECORDED",
  }));

  const { error: recipientsError } = await supabase
    .from("communication_message_recipients")
    .insert(rows);

  if (recipientsError) {
    throw new Error(recipientsError.message);
  }

  return {
    messageId: message.id,
    recipientCount: rows.length,
    studentCount: uniqueStudentIds.length,
  };
}

export async function listCommunicationMessages(
  schoolId: string,
): Promise<CommunicationMessageListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("communication_messages")
    .select(
      `
      id, subject, body, audience_type, filter_summary, channel, created_at,
      sender:profiles!sent_by_id(full_name),
      recipients:communication_message_recipients(
        id, student_name, guardian_name, guardian_phone, guardian_email, status
      )
    `,
    )
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const sender = Array.isArray(row.sender) ? row.sender[0] : row.sender;
    const recipients = (row.recipients ?? []) as CommunicationMessageListItem["recipients"];
    return {
      id: row.id,
      subject: row.subject,
      body: row.body,
      audience_type: row.audience_type,
      filter_summary: row.filter_summary,
      channel: row.channel,
      created_at: row.created_at,
      sender_name: sender?.full_name ?? null,
      recipient_count: recipients.length,
      recipients,
    };
  });
}
