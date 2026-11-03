import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { formatInr } from "@/lib/class-levels";
import { getFeePaymentReceipt } from "@/lib/data/fees";
import { ReceiptPrintButton } from "./receipt-print-button";

export default async function FeeReceiptPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  const profile = await requireAdmin();
  const receipt = await getFeePaymentReceipt(profile.school_id, paymentId);
  if (!receipt) notFound();

  const addressLine = [
    receipt.school.address,
    receipt.school.city,
    receipt.school.state,
    receipt.school.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/admin/fees/collect?studentId=${receipt.student.id}`}
          className="text-sm text-brand underline"
        >
          Back to collect payment
        </Link>
        <ReceiptPrintButton />
      </div>

      <article className="rounded-xl border border-border bg-card p-6 shadow-sm print:border-0 print:shadow-none">
        <header className="flex items-start gap-4 border-b border-border pb-4">
          {receipt.school.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={receipt.school.logoUrl}
              alt=""
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="display-font text-2xl">{receipt.school.name}</h1>
            {addressLine ? (
              <p className="mt-1 text-sm text-muted">{addressLine}</p>
            ) : null}
            <p className="text-sm text-muted">
              {[receipt.school.phone, receipt.school.email]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted">
              Fee receipt
            </p>
            <p className="font-semibold tabular-nums">
              {receipt.receiptNumber}
            </p>
          </div>
        </header>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Date</dt>
            <dd className="font-medium">
              {new Date(receipt.paidAt).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Method</dt>
            <dd className="font-medium">{receipt.method}</dd>
          </div>
          <div>
            <dt className="text-muted">Student</dt>
            <dd className="font-medium">
              {receipt.student.firstName} {receipt.student.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Reg. ID</dt>
            <dd className="font-medium tabular-nums">
              {receipt.student.admissionNumber}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Class</dt>
            <dd className="font-medium">
              {[receipt.student.className, receipt.student.sectionName]
                .filter(Boolean)
                .join(" · ") || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Received by</dt>
            <dd className="font-medium">{receipt.recordedByName || "—"}</dd>
          </div>
        </dl>

        <div className="mt-6 rounded-lg border border-border bg-background p-4">
          <p className="text-sm text-muted">Amount received</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {formatInr(receipt.amount)}
          </p>
          {receipt.note ? (
            <p className="mt-2 text-sm text-muted">Note: {receipt.note}</p>
          ) : null}
        </div>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Annual billed</dt>
            <dd className="font-medium tabular-nums">
              {formatInr(receipt.billed)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Total paid</dt>
            <dd className="font-medium tabular-nums">
              {formatInr(receipt.paidTotal)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Pending</dt>
            <dd className="font-medium tabular-nums">
              {formatInr(receipt.pending)}
            </dd>
          </div>
        </dl>

        <p className="mt-8 text-xs text-muted">
          This is a computer-generated receipt for school fee payment.
        </p>
      </article>
    </div>
  );
}
