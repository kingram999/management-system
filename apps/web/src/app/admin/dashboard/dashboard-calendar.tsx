"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SchoolEventRecord } from "@/lib/data/school-events";
import {
  deleteSchoolEventAction,
  saveSchoolEventAction,
} from "./actions";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function DashboardCalendar({
  initialYear,
  initialMonth,
  events,
}: {
  initialYear: number;
  initialMonth: number;
  events: SchoolEventRecord[];
}) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [editing, setEditing] = useState<SchoolEventRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, SchoolEventRecord[]>();
    for (const event of events) {
      const key = event.event_date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const items: Array<{ date: string | null; day: number | null }> = [];
    for (let i = 0; i < startPad; i += 1) {
      items.push({ date: null, day: null });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      items.push({
        day,
        date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      });
    }
    return items;
  }, [year, month]);

  const dayEvents = eventsByDate.get(selectedDate) ?? [];
  const todayKey = toDateKey(new Date());

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    const nextYear = d.getFullYear();
    const nextMonth = d.getMonth() + 1;
    setYear(nextYear);
    setMonth(nextMonth);
    router.push(`/admin?year=${nextYear}&month=${nextMonth}`);
  }

  async function onSave(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("eventDate", selectedDate);
    if (editing) formData.set("id", editing.id);
    const result = await saveSchoolEventAction(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setCreating(false);
    setEditing(null);
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this event?")) return;
    setLoading(true);
    const result = await deleteSchoolEventAction(id);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(null);
    router.refresh();
  }

  const formOpen = creating || editing;

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{monthLabel(year, month)}</h3>
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="secondary" onClick={() => shiftMonth(-1)}>
            Prev
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => shiftMonth(1)}>
            Next
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border text-center text-xs">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-card px-1 py-2 font-medium text-muted">
            {d}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (!cell.date) {
            return <div key={`pad-${index}`} className="min-h-12 bg-card" />;
          }
          const hasEvents = (eventsByDate.get(cell.date) ?? []).length > 0;
          const selected = cell.date === selectedDate;
          const isToday = cell.date === todayKey;
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => {
                setSelectedDate(cell.date!);
                setCreating(false);
                setEditing(null);
              }}
              className={`min-h-12 px-1 py-2 text-sm transition ${
                selected
                  ? "bg-brand font-semibold text-white hover:bg-brand-dark"
                  : "bg-card hover:bg-background"
              } ${!selected && isToday ? "text-brand font-semibold" : ""} ${
                !selected && hasEvents ? "text-brand" : ""
              }`}
            >
              {cell.day}
              {hasEvents ? (
                <span
                  className={`mt-1 block h-1 w-1 rounded-full mx-auto ${
                    selected ? "bg-white" : "bg-brand"
                  }`}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setCreating(true);
              setEditing(null);
            }}
          >
            Add event
          </Button>
        </div>

        {dayEvents.length === 0 ? (
          <p className="text-sm text-muted">No events this day.</p>
        ) : (
          <ul className="space-y-2">
            {dayEvents.map((event) => (
              <li
                key={event.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-xs text-muted">
                    {event.event_type}
                    {event.start_time ? ` · ${event.start_time}` : ""}
                    {event.end_time ? `–${event.end_time}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(event);
                    setCreating(false);
                  }}
                >
                  Edit
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {formOpen ? (
        <form action={onSave} className="mt-4 space-y-3 rounded-lg border border-border p-3">
          <p className="text-sm font-semibold">
            {editing ? "Edit event" : "New event"}
          </p>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={editing?.title ?? ""}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="startTime">Start</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                defaultValue={editing?.start_time ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                defaultValue={editing?.end_time ?? ""}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="eventType">Type</Label>
            <select
              id="eventType"
              name="eventType"
              defaultValue={editing?.event_type ?? "EVENT"}
              className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="EVENT">Event</option>
              <option value="MEETING">Meeting</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={editing?.notes ?? ""}
              className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
            {editing ? (
              <Button
                type="button"
                size="sm"
                variant="danger"
                disabled={loading}
                onClick={() => onDelete(editing.id)}
              >
                Delete
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
