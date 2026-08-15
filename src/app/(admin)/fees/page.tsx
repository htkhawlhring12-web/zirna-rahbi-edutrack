import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CLASS_LABELS } from "@/lib/constants";
import { FeeStructureForm } from "@/components/forms/fee-structure-form";
import { BulkFeeDueForm } from "@/components/forms/bulk-fee-due-form";
import { FeeStatusBadge } from "@/components/fee-status-badge";
import { getEffectiveFeeStatus } from "@/lib/fee-status";

const CYCLE_LABELS: Record<string, string> = {
  MONTHLY: "Monthly",
  TERM: "Per term",
  ANNUAL: "Annual",
};

export default async function FeesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const [feeStructures, feePayments, totals] = await Promise.all([
    db.feeStructure.findMany({
      orderBy: [{ classLevel: "asc" }, { effectiveFrom: "desc" }],
    }),
    db.feePayment.findMany({
      include: { student: true },
      orderBy: { dueDate: "desc" },
      take: 50,
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

  const unpaidCount = feePayments.filter(
    (p) =>
      getEffectiveFeeStatus({
        status: p.status,
        dueDate: p.dueDate,
        amountDue: Number(p.amountDue),
        amountPaid: Number(p.amountPaid),
      }) !== "PAID"
  ).length;

  const totalDue = Number(totals._sum.amountDue ?? 0);
  const totalPaid = Number(totals._sum.amountPaid ?? 0);
  const totalOutstanding = totalDue - totalPaid;
  const percentCollected = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-lg font-semibold text-slate-900">Fees</h1>
      <p className="mt-1 text-sm text-slate-500">
        Set fee amounts per class, and record/track payments per student from
        each student&rsquo;s page.
      </p>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-slate-700">Revenue overview</h2>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Total due</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">₹{totalDue}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Total collected</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">₹{totalPaid}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Outstanding</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">₹{totalOutstanding}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">% collected</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{percentCollected}%</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Based on {totals._count._all} fee record{totals._count._all === 1 ? "" : "s"} total.
        </p>
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
                {fs.effectiveFrom.toLocaleDateString('en-GB')}
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
          <h2 className="text-sm font-medium text-slate-700">All fee payments</h2>
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
                    ₹{Number(p.amountDue)} due {p.dueDate.toLocaleDateString('en-GB')}
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
              No fee payments recorded yet.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}