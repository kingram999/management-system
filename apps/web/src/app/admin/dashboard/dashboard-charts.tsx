import { formatInr } from "@/lib/class-levels";

export function AnnualFeeBars({
  billed,
  collected,
  pending,
}: {
  billed: number;
  collected: number;
  pending: number;
}) {
  const max = Math.max(billed, collected, pending, 1);
  const rows = [
    { label: "Billed", value: billed, color: "var(--brand)" },
    { label: "Collected", value: collected, color: "var(--success)" },
    { label: "Pending", value: pending, color: "var(--accent)" },
  ];

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <h3 className="text-lg font-semibold">Annual fee summary</h3>
      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted">{row.label}</span>
              <span className="tabular-nums font-medium">
                {formatInr(row.value)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-card">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round((row.value / max) * 100)}%`,
                  backgroundColor: row.color,
                  minWidth: row.value > 0 ? "0.5rem" : 0,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IncomeExpenseDonut({
  income,
  expense,
}: {
  income: number;
  expense: number;
}) {
  const size = 160;
  const stroke = 28;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = income + expense;
  const incomeShare = total > 0 ? income / total : 0.5;
  const expenseShare = total > 0 ? expense / total : 0.5;
  const incomeArc = c * incomeShare;
  const expenseArc = c * expenseShare;
  const incomePct = Math.round(incomeShare * 100);
  const expensePct = Math.round(expenseShare * 100);

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <h3 className="text-lg font-semibold">Income vs expense</h3>
      <p className="mt-1 text-xs text-muted">This month · inventory ledger</p>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--brand)"
            strokeWidth={stroke}
            strokeDasharray={`${incomeArc} ${c - incomeArc}`}
            strokeDashoffset={0}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={stroke}
            strokeDasharray={`${expenseArc} ${c - expenseArc}`}
            strokeDashoffset={-incomeArc}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ background: "var(--brand)" }}
            />
            Income {incomePct}% · {formatInr(income)}
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ background: "var(--accent)" }}
            />
            Expense {expensePct}% · {formatInr(expense)}
          </div>
          {total === 0 ? (
            <p className="max-w-[14rem] text-xs text-muted">
              No ledger entries this month yet.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
