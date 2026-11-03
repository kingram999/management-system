"use client";

import { useMemo, useState } from "react";
import {
  clearStudentTransportAction,
  upsertStudentTransportAction,
} from "@/app/admin/transport/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StudentProfile } from "@/lib/data/students";
import type {
  TransportMode,
  TransportRouteRecord,
  TransportStopRecord,
} from "@/lib/data/transport";
import {
  setPrimaryGuardianAction,
  updateGuardianAction,
  updateStudentPersonalAction,
} from "../actions";

const TABS = [
  "Overview",
  "Personal",
  "Guardians",
  "Academics",
  "Attendance",
  "Fees",
  "Health",
  "Conduct",
  "Documents",
  "Transport",
  "Timeline",
] as const;

type Tab = (typeof TABS)[number];

const LIVE_TABS: Tab[] = ["Overview", "Personal", "Guardians", "Transport"];

const MODE_LABEL: Record<TransportMode, string> = {
  BOTH: "Pickup & drop",
  PICKUP: "Pickup only",
  DROP: "Drop only",
};

export function StudentProfileClient({
  student,
  routes,
  stops,
}: {
  student: StudentProfile;
  routes: TransportRouteRecord[];
  stops: TransportStopRecord[];
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [routeId, setRouteId] = useState(student.transport?.route_id ?? "");
  const [stopId, setStopId] = useState(student.transport?.stop_id ?? "");
  const [mode, setMode] = useState<TransportMode>(
    student.transport?.mode ?? "BOTH",
  );

  const routeStops = useMemo(
    () => stops.filter((s) => s.route_id === routeId),
    [stops, routeId],
  );

  async function run(
    action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>,
    formData: FormData,
    successMessage: string,
  ) {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await action(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage(successMessage);
  }

  const classLabel = [
    student.enrollment?.class_name,
    student.enrollment?.section_name,
  ]
    .filter(Boolean)
    .join("-");

  return (
    <div className="mt-3 space-y-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background text-2xl font-semibold text-brand">
          {student.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={student.photo_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            `${student.first_name.slice(0, 1)}${student.last_name.slice(0, 1)}`
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="display-font text-3xl">
            {student.first_name} {student.last_name}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {student.admission_number}
            {classLabel ? ` · ${classLabel}` : ""}
            {` · ${student.status.replaceAll("_", " ")}`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              tab === item
                ? "bg-brand text-white"
                : "border border-border bg-background text-muted"
            }`}
          >
            {item}
            {!LIVE_TABS.includes(item) ? (
              <span className="ml-1 opacity-70">·</span>
            ) : null}
          </button>
        ))}
      </div>

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {tab === "Overview" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-border p-4">
            <h3 className="font-semibold">Snapshot</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Registration ID</dt>
                <dd className="tabular-nums">{student.admission_number}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Class</dt>
                <dd>{classLabel || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Academic year</dt>
                <dd>{student.enrollment?.academic_year_name || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Roll number</dt>
                <dd>{student.enrollment?.roll_number || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">House</dt>
                <dd>{student.house || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Category</dt>
                <dd>{student.category || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 sm:col-span-2">
                <dt className="text-muted">Remarks</dt>
                <dd className="text-right">{student.remarks || "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-border p-4">
            <h3 className="font-semibold">Contacts & guardians</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {student.guardians.length === 0 ? (
                <li className="text-muted">No guardians linked.</li>
              ) : (
                student.guardians.map((g) => (
                  <li
                    key={g.guardian_id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">
                        {g.full_name}
                        {g.is_primary ? (
                          <span className="ml-2 text-xs text-brand">Primary</span>
                        ) : null}
                      </p>
                      <p className="text-muted">
                        {g.relation}
                        {g.relation_other ? ` (${g.relation_other})` : ""}
                      </p>
                    </div>
                    <p className="tabular-nums text-muted">{g.phone}</p>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-border p-4 lg:col-span-2">
            <h3 className="font-semibold">Alerts</h3>
            <p className="mt-2 text-sm text-muted">
              No active alerts. Fee due, attendance, and medical flags will appear
              here when those modules are connected.
            </p>
          </section>
        </div>
      ) : null}

      {tab === "Personal" ? (
        <form
          className="grid max-w-3xl gap-4 sm:grid-cols-2"
          action={async (formData) => {
            formData.set("studentId", student.id);
            await run(updateStudentPersonalAction, formData, "Personal details saved.");
          }}
        >
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              name="firstName"
              defaultValue={student.first_name}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              name="lastName"
              defaultValue={student.last_name}
              required
            />
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={student.date_of_birth}
              required
            />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              name="gender"
              defaultValue={student.gender}
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <Label htmlFor="bloodGroup">Blood group</Label>
            <Input
              id="bloodGroup"
              name="bloodGroup"
              defaultValue={student.blood_group ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={student.status}
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="TRANSFERRED">Transferred</option>
              <option value="ALUMNI">Alumni</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              name="nationality"
              defaultValue={student.nationality ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="motherTongue">Language</Label>
            <Input
              id="motherTongue"
              name="motherTongue"
              defaultValue={student.mother_tongue ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="idNumber">ID number</Label>
            <Input
              id="idNumber"
              name="idNumber"
              defaultValue={student.id_number ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="house">House</Label>
            <Input id="house" name="house" defaultValue={student.house ?? ""} />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              defaultValue={student.category ?? ""}
              className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="">Select category</option>
              <option value="GENERAL">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="EWS">EWS</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={student.address ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={student.city ?? ""} />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" defaultValue={student.state ?? ""} />
          </div>
          <div>
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              name="pincode"
              defaultValue={student.pincode ?? ""}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="remarks">Remarks</Label>
            <textarea
              id="remarks"
              name="remarks"
              rows={3}
              defaultValue={student.remarks ?? ""}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save personal details"}
            </Button>
          </div>
        </form>
      ) : null}

      {tab === "Guardians" ? (
        <div className="space-y-4">
          {student.guardians.length === 0 ? (
            <p className="text-sm text-muted">No guardians linked yet.</p>
          ) : (
            student.guardians.map((g) => (
              <form
                key={g.guardian_id}
                className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2"
                action={async (formData) => {
                  formData.set("studentId", student.id);
                  formData.set("guardianId", g.guardian_id);
                  formData.set("linkId", g.link_id);
                  await run(updateGuardianAction, formData, "Guardian saved.");
                }}
              >
                <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {g.relation}
                    {g.relation_other ? ` (${g.relation_other})` : ""}
                    {g.is_primary ? (
                      <span className="ml-2 text-xs font-medium text-brand">
                        Primary contact
                      </span>
                    ) : null}
                  </p>
                  {!g.is_primary ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={pending}
                      onClick={async () => {
                        const formData = new FormData();
                        formData.set("studentId", student.id);
                        formData.set("linkId", g.link_id);
                        await run(
                          setPrimaryGuardianAction,
                          formData,
                          "Primary contact updated.",
                        );
                      }}
                    >
                      Make primary
                    </Button>
                  ) : null}
                </div>
                <div>
                  <Label>Name</Label>
                  <Input name="fullName" defaultValue={g.full_name} required />
                </div>
                <div>
                  <Label>Occupation</Label>
                  <Input name="occupation" defaultValue={g.occupation ?? ""} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input name="phone" defaultValue={g.phone} required />
                </div>
                <div>
                  <Label>Phone 2</Label>
                  <Input
                    name="phoneSecondary"
                    defaultValue={g.phone_secondary ?? ""}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    name="email"
                    type="email"
                    defaultValue={g.email ?? ""}
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input name="address" defaultValue={g.address ?? ""} />
                </div>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    name="canPickup"
                    defaultChecked={g.can_pickup}
                  />
                  Authorised to pick up the child
                </label>
                <div className="sm:col-span-2">
                  <Button type="submit" size="sm" disabled={pending}>
                    Save guardian
                  </Button>
                </div>
              </form>
            ))
          )}
        </div>
      ) : null}

      {tab === "Transport" ? (
        <section className="space-y-4 rounded-xl border border-border p-4">
          <div>
            <h3 className="font-semibold">Bus assignment</h3>
            <p className="mt-1 text-sm text-muted">
              {student.transport
                ? `${student.transport.route_name} · ${student.transport.stop_name} · ${MODE_LABEL[student.transport.mode]}`
                : "Not assigned to transport"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="transport-route">Route</Label>
              <select
                id="transport-route"
                value={routeId}
                onChange={(e) => {
                  setRouteId(e.target.value);
                  setStopId("");
                }}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
              >
                <option value="">Select route</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="transport-stop">Stop</Label>
              <select
                id="transport-stop"
                value={stopId}
                onChange={(e) => setStopId(e.target.value)}
                disabled={!routeId}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
              >
                <option value="">Select stop</option>
                {routeStops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.sequence}. {stop.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="transport-mode">Mode</Label>
              <select
                id="transport-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as TransportMode)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
              >
                <option value="BOTH">Pickup & drop</option>
                <option value="PICKUP">Pickup only</option>
                <option value="DROP">Drop only</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending || !routeId || !stopId}
              onClick={async () => {
                const formData = new FormData();
                formData.set("studentId", student.id);
                formData.set("routeId", routeId);
                formData.set("stopId", stopId);
                formData.set("mode", mode);
                await run(
                  upsertStudentTransportAction,
                  formData,
                  "Transport assignment saved.",
                );
              }}
            >
              Save assignment
            </Button>
            {student.transport ? (
              <Button
                type="button"
                size="sm"
                variant="danger"
                disabled={pending}
                onClick={async () => {
                  if (
                    !window.confirm(
                      "Clear transport assignment for this student?",
                    )
                  ) {
                    return;
                  }
                  const formData = new FormData();
                  formData.set("studentId", student.id);
                  await run(
                    clearStudentTransportAction,
                    formData,
                    "Transport assignment cleared.",
                  );
                  setRouteId("");
                  setStopId("");
                  setMode("BOTH");
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {!LIVE_TABS.includes(tab) ? (
        <div className="rounded-xl border border-border px-4 py-10 text-center">
          <h3 className="font-semibold">{tab}</h3>
          <p className="mt-2 text-sm text-muted">
            Coming soon — this tab will show {tab.toLowerCase()} once that module
            is built.
          </p>
        </div>
      ) : null}
    </div>
  );
}
