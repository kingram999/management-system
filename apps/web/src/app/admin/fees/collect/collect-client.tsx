"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SortableTh,
  sortRows,
  useSortableState,
} from "@/components/sortable-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatInr } from "@/lib/class-levels";
import type {
  FeePaymentRecord,
  StudentFeeBalance,
} from "@/lib/data/fees";
import { recordFeePaymentAction } from "../actions";
import { FeeReceiptModal } from "./fee-receipt-modal";

type PaymentSortKey = "date" | "receipt" | "amount" | "method" | "note";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function CollectPaymentClient({
  students,
  initialStudentId,
  initialBalance,
  initialPayments,
}: {
  students: StudentFeeBalance[];
  initialStudentId: string;
  initialBalance: StudentFeeBalance | null;
  initialPayments: FeePaymentRecord[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [studentId, setStudentId] = useState(initialStudentId);
  const [amount, setAmount] = useState(
    initialBalance && initialBalance.pending > 0
      ? String(initialBalance.pending)
      : "",
  );
  const [method, setMethod] = useState("CASH");
  const [paidAt, setPaidAt] = useState(todayInputValue());
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null);
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(
    null,
  );
  const { sortKey, sortDir, toggleSort } =
    useSortableState<PaymentSortKey>("date");
  const sortedPayments = useMemo(
    () =>
      sortRows(initialPayments, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "date":
            return row.paid_at;
          case "receipt":
            return row.receipt_number;
          case "amount":
            return row.amount;
          case "method":
            return row.method;
          case "note":
            return row.note;
        }
      }),
    [initialPayments, sortKey, sortDir],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? students.filter((student) => {
          const haystack = [
            student.firstName,
            student.lastName,
            `${student.firstName} ${student.lastName}`,
            student.admissionNumber,
            student.className,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
      : students;
    return pool.slice(0, 40);
  }, [students, query]);

  const balance =
    students.find((s) => s.studentId === studentId) ?? initialBalance;

  useEffect(() => {
    if (!balance) return;
    setAmount(balance.pending > 0 ? String(balance.pending) : "");
  }, [balance?.studentId, balance?.pending, balance]);

  function onSelectStudent(id: string) {
    setStudentId(id);
    setMessage(null);
    setError(null);
    setLastPaymentId(null);
    const found = students.find((s) => s.studentId === id);
    setAmount(found && found.pending > 0 ? String(found.pending) : "");
    router.replace(`/admin/fees/collect?studentId=${id}`);
  }

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    setError(null);
    formData.set("studentId", studentId);
    formData.set("amount", amount);
    formData.set("method", method);
    formData.set("paidAt", paidAt);
    formData.set("note", note);
    const result = await recordFeePaymentAction(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage(`Payment recorded. Receipt ${result.receiptNumber}.`);
    setLastPaymentId(result.paymentId ?? null);
    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="display-font text-3xl">Collect payment</h2>
        <p className="mt-1 text-sm text-muted">
          Record a fee payment against a student’s annual due
        </p>
      </div>

      <div className="grid max-w-xl gap-3 rounded-xl border border-border bg-background p-4">
        <div>
          <Label htmlFor="studentSearch">Find student</Label>
          <Input
            id="studentSearch"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or reg. ID…"
          />
        </div>
        <select
          value={studentId}
          onChange={(e) => onSelectStudent(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">Select student</option>
          {matches.map((student) => (
            <option key={student.studentId} value={student.studentId}>
              {student.firstName} {student.lastName} ·{" "}
              {student.admissionNumber}
              {student.className ? ` · ${student.className}` : ""}
            </option>
          ))}
        </select>
      </div>

      {balance ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-sm text-muted">Billed</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatInr(balance.billed)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-sm text-muted">Paid</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatInr(balance.paid)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-sm text-muted">Pending</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatInr(balance.pending)}
            </p>
          </div>
        </div>
      ) : null}

      <form action={onSubmit} className="grid max-w-xl gap-4">
        <div>
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            disabled={!studentId || (balance?.pending ?? 0) <= 0}
          />
        </div>
        <div>
          <Label htmlFor="method">Method</Label>
          <select
            id="method"
            name="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="mt-1 flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="BANK">Bank</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <Label htmlFor="paidAt">Payment date</Label>
          <Input
            id="paidAt"
            name="paidAt"
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="note">Note</Label>
          <Input
            id="note"
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            disabled={
              loading || !studentId || (balance?.pending ?? 0) <= 0
            }
          >
            {loading ? "Saving…" : "Record payment"}
          </Button>
          {lastPaymentId ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReceiptPaymentId(lastPaymentId)}
            >
              View receipt
            </Button>
          ) : null}
        </div>
        {message ? <p className="text-sm text-brand">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {balance && balance.pending <= 0 ? (
          <p className="text-sm text-muted">
            This student has no pending fee.
          </p>
        ) : null}
      </form>

      {studentId && initialPayments.length > 0 && studentId === initialStudentId ? (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Recent payments</h3>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-background text-muted">
                <tr>
                  <SortableTh columnKey="date" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
                  <SortableTh columnKey="receipt" label="Receipt" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
                  <SortableTh columnKey="amount" label="Amount" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
                  <SortableTh columnKey="method" label="Method" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
                  <SortableTh columnKey="note" label="Note" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="px-3 py-3 font-medium" />
                  <th className="px-3 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {sortedPayments.map((payment) => (
                  <tr key={payment.id} className="border-t border-border">
                    <td className="px-3 py-3 text-muted">
                      {new Date(payment.paid_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      {payment.receipt_number}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      {formatInr(payment.amount)}
                    </td>
                    <td className="px-3 py-3 text-muted">{payment.method}</td>
                    <td className="px-3 py-3 text-muted">
                      {payment.note || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        className="text-sm text-brand underline"
                        onClick={() => setReceiptPaymentId(payment.id)}
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {receiptPaymentId ? (
        <FeeReceiptModal
          paymentId={receiptPaymentId}
          onClose={() => setReceiptPaymentId(null)}
        />
      ) : null}
    </div>
  );
}
