import { createClient } from "@/lib/supabase/server";

export type SchoolEventType = "MEETING" | "EVENT" | "OTHER";

export type SchoolEventRecord = {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  event_type: SchoolEventType;
  notes: string | null;
};

export async function listSchoolEventsForMonth(
  schoolId: string,
  year: number,
  month: number,
): Promise<SchoolEventRecord[]> {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("school_events")
    .select("id, title, event_date, start_time, end_time, event_type, notes")
    .eq("school_id", schoolId)
    .gte("event_date", start)
    .lte("event_date", end)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as SchoolEventRecord[];
}

export async function upsertSchoolEvent(input: {
  schoolId: string;
  createdById: string;
  id?: string | null;
  title: string;
  eventDate: string;
  startTime?: string | null;
  endTime?: string | null;
  eventType: SchoolEventType;
  notes?: string | null;
}): Promise<SchoolEventRecord> {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");
  if (!input.eventDate) throw new Error("Date is required.");

  const supabase = await createClient();
  const payload = {
    school_id: input.schoolId,
    title,
    event_date: input.eventDate,
    start_time: input.startTime?.trim() || null,
    end_time: input.endTime?.trim() || null,
    event_type: input.eventType,
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("school_events")
      .update(payload)
      .eq("id", input.id)
      .eq("school_id", input.schoolId)
      .select("id, title, event_date, start_time, end_time, event_type, notes")
      .single();
    if (error || !data) {
      throw new Error(error?.message || "Could not update event.");
    }
    return data as SchoolEventRecord;
  }

  const { data, error } = await supabase
    .from("school_events")
    .insert({
      ...payload,
      created_by_id: input.createdById,
    })
    .select("id, title, event_date, start_time, end_time, event_type, notes")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Could not create event.");
  }
  return data as SchoolEventRecord;
}

export async function deleteSchoolEvent(
  schoolId: string,
  eventId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("school_events")
    .delete()
    .eq("id", eventId)
    .eq("school_id", schoolId);
  if (error) throw new Error(error.message);
}
