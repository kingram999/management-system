import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { formatInr } from "@/lib/class-levels";
import { createClient } from "@/lib/supabase/server";
import { ReviewActions } from "./review-actions";

export default async function AdmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireAdmin();
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("admission_applications")
    .select(
      `
      *,
      class:classes(id, name, sections(id, name, deleted_at)),
      academic_year:academic_years(id, name),
      student:students(id, admission_number)
    `,
    )
    .eq("id", id)
    .eq("school_id", profile.school_id)
    .single();

  if (!application) {
    notFound();
  }

  const schoolClass = Array.isArray(application.class)
    ? application.class[0]
    : application.class;
  const academicYear = Array.isArray(application.academic_year)
    ? application.academic_year[0]
    : application.academic_year;
  const student = Array.isArray(application.student)
    ? application.student[0]
    : application.student;
  const sections = (schoolClass?.sections ?? []).filter(
    (section: { deleted_at?: string | null }) => !section.deleted_at,
  );

  const relationLabel =
    application.guardian_relation === "OTHER" &&
    application.guardian_relation_other
      ? `Other (${application.guardian_relation_other})`
      : application.guardian_relation;

  const concessionLabel = !application.concession_type
    ? "—"
    : application.concession_type === "PERCENT"
      ? `${application.concession_value}%`
      : formatInr(Number(application.concession_value || 0));

  return (
    <div>
      <Link href="/admin/admissions/new" className="text-sm text-brand">
        ← Back to Create Admission
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="display-font text-3xl">
            {application.first_name} {application.last_name}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {application.application_number} ·{" "}
            {application.status.replaceAll("_", " ")}
          </p>
        </div>
        {student ? (
          <div className="rounded-lg border border-brand/20 bg-brand/5 px-4 py-2 text-sm">
            Registration ID:{" "}
            <span className="font-semibold">{student.admission_number}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border p-4">
          <h3 className="font-semibold">Student</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Date of birth</dt>
              <dd>{application.date_of_birth}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Gender</dt>
              <dd>{application.gender}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Applying for</dt>
              <dd>
                {schoolClass?.name} ({academicYear?.name})
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Annual fee</dt>
              <dd>
                {application.fee_amount != null
                  ? formatInr(application.fee_amount)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Concession</dt>
              <dd>{concessionLabel}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Fee to be paid</dt>
              <dd className="font-semibold">
                {application.final_fee_amount != null
                  ? formatInr(application.final_fee_amount)
                  : application.fee_amount != null
                    ? formatInr(application.fee_amount)
                    : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Category</dt>
              <dd>{application.category || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Previous school</dt>
              <dd>{application.previous_school || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Remarks</dt>
              <dd className="text-right">{application.remarks || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Address</dt>
              <dd className="text-right">
                {[
                  application.address,
                  application.city,
                  application.state,
                  application.pincode,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border p-4">
          <h3 className="font-semibold">Parents & guardian</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Father</dt>
              <dd>{application.father_name || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Mother</dt>
              <dd>{application.mother_name || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Guardian</dt>
              <dd>{application.guardian_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Relation</dt>
              <dd>{relationLabel}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Contact 1</dt>
              <dd>{application.guardian_phone}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Contact 2</dt>
              <dd>{application.guardian_phone_secondary || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Email</dt>
              <dd>{application.guardian_email || "—"}</dd>
            </div>
          </dl>
        </section>
      </div>

      {application.status !== "APPROVED" && application.status !== "REJECTED" ? (
        <section className="mt-8 rounded-xl border border-border p-4">
          <h3 className="font-semibold">Review decision</h3>
          <p className="mt-1 text-sm text-muted">
            Approve creates a student record, guardian link, and class enrollment.
          </p>
          <div className="mt-4">
            <ReviewActions
              applicationId={application.id}
              sections={sections}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
