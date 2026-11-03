"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  deleteSchoolEvent,
  upsertSchoolEvent,
  type SchoolEventType,
} from "@/lib/data/school-events";

const EVENT_TYPES: SchoolEventType[] = ["MEETING", "EVENT", "OTHER"];

export async function saveSchoolEventAction(formData: FormData) {
  const profile = await requireAdmin();
  const id = String(formData.get("id") || "").trim() || null;
  const title = String(formData.get("title") || "");
  const eventDate = String(formData.get("eventDate") || "");
  const startTime = String(formData.get("startTime") || "").trim() || null;
  const endTime = String(formData.get("endTime") || "").trim() || null;
  const eventTypeRaw = String(formData.get("eventType") || "EVENT");
  const notes = String(formData.get("notes") || "").trim() || null;
  const eventType = (
    EVENT_TYPES.includes(eventTypeRaw as SchoolEventType)
      ? eventTypeRaw
      : "EVENT"
  ) as SchoolEventType;

  try {
    const event = await upsertSchoolEvent({
      schoolId: profile.school_id,
      createdById: profile.id,
      id,
      title,
      eventDate,
      startTime,
      endTime,
      eventType,
      notes,
    });
    revalidatePath("/admin");
    return { success: true, event };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save event.",
    };
  }
}

export async function deleteSchoolEventAction(eventId: string) {
  const profile = await requireAdmin();
  if (!eventId) return { error: "Event is required." };

  try {
    await deleteSchoolEvent(profile.school_id, eventId);
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not delete event.",
    };
  }
}
