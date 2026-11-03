"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import type { PayrollRow } from "@/lib/data/employees";
import { recordSalaryPaymentAction } from "../actions";

type SortKey = "name" | "salary" | "paid" | "pending";

export function PayrollClient({
  periodLabel,
  rows,
}: {
  periodLabel: string;
  rows: PayrollRow[];
}) {
  const router = useRouter();
  const [period, setPeriod] = useState(periodLabel);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("CASH");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { sortKey, sortDir, toggleSort } = useSortableState<SortKey>("name");

  const sorted = useMemo(
    () =>
      sortRows(rows, sortKey, sortDir, (row, key) => {
        switch (key) {
          case "name":
            return `${row.employee.last_name} ${row.employee.first_name}`;
          case "salary":
            return row.employee.monthly_salary;
          case "paid":
            return row.paidThisPeriod;
          case "pending":
            return row.pendingThisPeriod;
        }
      }),
    [rows, sortKey, sortDir],
  );

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.salary += row.employee.monthly_salary;
        acc.paid += row.paidThisPeriod;
        acc.pending += row.pendingThisPeriod;
        return acc;
      },
      { salary: 0, paid: 0, pending: 0 },
    );
  }, [rows]);

  function loadPeriod(next: string) {
    setPeriod(next);
    router.push(`/admin/employees/payroll?period=${encodeURIComponent(next)}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="display-font text-3xl">Payroll</h2>
        <p className="mt-1 text-sm text-muted">
          Monthly salary vs payments for {periodLabel}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Monthly salary total</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatInr(totals.salary)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Paid this period</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-brand">
            {formatInr(totals.paid)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted">Pending this period</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatInr(totals.pending)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-background p-4">
        <div>
          <Label htmlFor="period">Period (YYYY-MM)</Label>
          <Input
            id="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="2025-11"
          />
        </div>
        <Button type="button" variant="secondary" onClick={() => loadPeriod(period)}>
          Load period
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <SortableTh
                columnKey="name"
                label="Employee"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                columnKey="salary"
                label="Monthly salary"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                columnKey="paid"
                label="Paid"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <SortableTh
                columnKey="pending"
                label="Pending"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No active employees.
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr key={row.employee.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/employees/${row.employee.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {row.employee.first_name} {row.employee.last_name}
                    </Link>
                    <p className="text-xs text-muted">
                      {row.employee.designation}
                    </p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatInr(row.employee.monthly_salary)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatInr(row.paidThisPeriod)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatInr(row.pendingThisPeriod)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setPayingId(row.employee.id);
                        setAmount(
                          String(
                            row.pendingThisPeriod ||
                              row.employee.monthly_salary ||
                              0,
                          ),
                        );
                        setError(null);
                        setMessage(null);
                      }}
                    >
                      Record payment
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {payingId ? (
        <form
          className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2 lg:grid-cols-5"
          action={async (formData) => {
            formData.set("employeeId", payingId);
            formData.set("periodLabel", periodLabel);
            formData.set("amount", amount);
            formData.set("paidOn", paidOn);
            formData.set("method", method);
            formData.set("note", note);
            setPending(true);
            setError(null);
            setMessage(null);
            const result = await recordSalaryPaymentAction(formData);
            setPending(false);
            if (result.error) {
              setError(result.error);
              return;
            }
            setMessage("Payment recorded.");
            setPayingId(null);
            router.refresh();
          }}
        >
          <div>
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="paidOn">Paid on</Label>
            <Input
              id="paidOn"
              type="date"
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="method">Method</Label>
            <select
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK">Bank</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <Label htmlFor="note">Note</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" disabled={pending}>
              Save payment
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPayingId(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
