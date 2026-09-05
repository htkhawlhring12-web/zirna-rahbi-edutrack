import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CLASS_LABELS } from "@/lib/constants";
import { FeeStructureForm } from "@/components/forms/fee-structure-form";
import { BulkFeeDueForm } from "@/components/forms/bulk-fee-due-form";
import { FeeStatusBadge } from "@/components/fee-status-badge";
import { getEffectiveFeeStatus } from "@/lib/fee-status";
import { MonthlyRevenueChart } from "@/components/charts/monthly-revenue-chart";

const CYCLE_LABELS: Record<string, string> = {
  MONTHLY: "Monthly",
  TERM: "Per term",
  ANNUAL: "Annual",
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const { month } = await searchParams;
  const now = new Date();
  const selectedMonth = month ?? monthKey(now);

  const [feeStructures, allFeePayments, totals] = await Promise.all([
    db.feeStructure.findMany({
      orderBy: [{ classLevel: "asc" }, { effectiveFrom: "desc" }],
    }),
    db.feePayment.findMany({
      include: { student: true },
      orderBy: { dueDate: "desc" },
    }),
    db.feePayment.aggregate({
      _sum: { amountDue: true, amountPaid: true },
      _count: { _all: true },
    }),
  ]);

  // Only the most recent fee structure per class counts as "current".
  const currentByClass = new Map<string, (typeof feeStructures)[number]>();
  for (const fs of feeStructures) {
    if (!currentByClass.has(fs.classLevel)) currentByClass.set(fs.classLevel, fs);
  }

  // Group every payment by the month its due date falls in.
  const byMonth = new Map<string, { due: number; collected: number }>();
  for (const p of allFeePayments) {
    const key = monthKey(new Date(p.dueDate));
    const entry = byMonth.get(key) ?? { due: 0, collected: 0 };
    entry.due += Number(p.amountDue);
    entry.collected += Number(p.amountPaid);
    byMonth.set(key, entry);
  }

  // Last 6 months (including any month with data), oldest to newest, for the chart.
  const sortedKeys = Array.from(byMonth.keys()).sort();
  const chartKeys = sortedKeys.slice(-6);
  const chartData = chartKeys.map((key) => ({
    month: monthLabel(key),
    due: byMonth.get(key)!.due,
    collected: byMonth.get(key)!.collected,
  }));

  // Available months for the dropdown, newest first.
  const availableMonths = sortedKeys.slice().reverse();
  if (!availableMonths.includes(selectedMonth)) availableMonths.unshift(selectedMonth);

  const feePayments = allFeePayments.filter(
    (p) => monthKey(new Date(p.dueDate)) === selectedMonth
  );

  const unpaidCount = feePayments.filter(
    (p) =>
      getEffectiveFeeStatus({
        status: p.status,
        dueDate: p.dueDate,
        amountDue: Number(p.amountDue),
        amountPaid: Number(p.amountPaid),
      }) !== "PAID"
  ).length;

  const monthDue = feePayments.reduce((sum, p) => sum + Number(p.amountDue), 0);
  const monthCollected = feePayments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
  const monthOutstanding = monthDue - monthCollected;
  const monthPercent = monthDue > 0 ? Math.round((monthCollected / monthDue) * 100) : 0;

  const totalDue = Number(totals._sum.amountDue ?? 0);
  const totalPaid = Number(totals._sum.amountPaid ?? 0);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-lg font-semibold text-slate-900">Fees</h1>
      <p className="mt-1 text-sm text-slate-500">
        Set fee amounts per class, and record/track payments per student from
        each student&rsquo;s page.
      </p>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-slate-700">Revenue trend (last 6 months)</h2>
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-4">
          {chartData.length > 0 ? (
            <MonthlyRevenueChart data={chartData} />
          ) : (
            <p className="text-sm text-slate-400">No fee records yet.</p>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          All-time: ₹{totalPaid} collected of ₹{totalDue} billed across{" "}
          {totals._count._all} record{totals._count._all === 1 ? "" : "s"}.
        </p>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">Month</h2>
          <form method="GET" className="flex items-center gap-2">
  <select
    name="month"
    defaultValue={selectedMonth}
    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
  >
    {availableMonths.map((key) => (
      <option key={key} value={key}>
        {monthLabel(key)}
      </option>
    ))}
  </select>
  <button
    type="submit"
    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
  >
    Go
  </button>
</form>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Due this month</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">₹{monthDue}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Collected</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">₹{monthCollected}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Outstanding</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">₹{monthOutstanding}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">% collected</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{monthPercent}%</p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-slate-700">Fee structure by class</h2>
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-4">
          <FeeStructureForm />
        </div>
        <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {Array.from(currentByClass.values()).map((fs) => (
            <li key={fs.id} className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-medium text-slate-900">
                {CLASS_LABELS[fs.classLevel]}
              </p>
              <p className="text-xs text-slate-500">
                ₹{Number(fs.amount)} · {CYCLE_LABELS[fs.billingCycle]} · effective{" "}
                {fs.effectiveFrom.toLocaleDateString("en-GB")}
              </p>
            </li>
          ))}
          {currentByClass.size === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">
              No fee structures set yet.
            </li>
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-slate-700">
          Add a fee due to a whole class
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Use this at the start of a billing cycle instead of adding the same due to
          each student one at a time.
        </p>
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-4">
          <BulkFeeDueForm />
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">
            Fee payments — {monthLabel(selectedMonth)}
          </h2>
          {unpaidCount > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {unpaidCount} unpaid or overdue
            </span>
          )}
        </div>
        <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {feePayments.map((p) => (
            <li key={p.id}>
              <Link
                href={`/students/${p.studentId}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {p.student.fullName}
                  </p>
                  <p className="text-xs text-slate-500">
                    ₹{Number(p.amountDue)} due {p.dueDate.toLocaleDateString("en-GB")}
                  </p>
                </div>
                <FeeStatusBadge
                  payment={{
                    status: p.status,
                    dueDate: p.dueDate,
                    amountDue: Number(p.amountDue),
                    amountPaid: Number(p.amountPaid),
                  }}
                />
              </Link>
            </li>
          ))}
          {feePayments.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">
              No fee payments this month.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}