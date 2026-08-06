"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FeeStatusBadge } from "@/components/fee-status-badge";
import { getEffectiveFeeStatus } from "@/lib/fee-status";

type FeePayment = {
  id: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  paidDate: string | null;
  status: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function RecordPaymentRow({ payment }: { payment: FeePayment }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [amountPaid, setAmountPaid] = useState(String(payment.amountPaid || payment.amountDue));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveStatus = getEffectiveFeeStatus({
    status: payment.status,
    dueDate: new Date(payment.dueDate),
    amountDue: payment.amountDue,
    amountPaid: payment.amountPaid,
  });

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/fee-payments/${payment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountPaid, paymentMethod: paymentMethod || undefined }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Could not save the payment.");
      return;
    }

    setEditing(false);
    router.refresh();
  }

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-900">
            ₹{payment.amountDue} due {new Date(payment.dueDate).toLocaleDateString()}
          </p>
          <p className="text-xs text-slate-500">
            {payment.amountPaid > 0
              ? `₹${payment.amountPaid} paid${payment.paidDate ? ` on ${new Date(payment.paidDate).toLocaleDateString()}` : ""}`
              : "No payment recorded yet"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FeeStatusBadge
            payment={{
              status: payment.status,
              dueDate: new Date(payment.dueDate),
              amountDue: payment.amountDue,
              amountPaid: payment.amountPaid,
            }}
          />
          {effectiveStatus !== "PAID" && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="text-xs font-medium text-slate-600 underline hover:text-slate-900"
            >
              {editing ? "Cancel" : "Record payment"}
            </button>
          )}
        </div>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Amount paid
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Method (optional)
            </label>
            <input
              placeholder="e.g. Cash, Bank transfer"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          {error && <p className="w-full text-xs text-red-600">{error}</p>}
        </form>
      )}
    </li>
  );
}

export function StudentFeesSection({
  studentId,
  initialPayments,
}: {
  studentId: string;
  initialPayments: FeePayment[];
}) {
  const router = useRouter();
  const [payments, setPayments] = useState(initialPayments);
  const [amountDue, setAmountDue] = useState("");
  const [dueDate, setDueDate] = useState(todayIso());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddDue(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/students/${studentId}/fee-payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountDue, dueDate }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(
        typeof data.error === "string" ? data.error : "Could not add the fee due."
      );
      return;
    }

    setPayments((prev) => [data.feePayment, ...prev]);
    setAmountDue("");
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleAddDue} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="amountDue">
            Amount due
          </label>
          <input
            id="amountDue"
            type="number"
            min="0"
            step="1"
            required
            value={amountDue}
            onChange={(e) => setAmountDue(e.target.value)}
            className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="dueDate">
            Due date
          </label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add fee due"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {payments.map((p) => (
          <RecordPaymentRow key={p.id} payment={p} />
        ))}
        {payments.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-400">
            No fee dues recorded yet.
          </li>
        )}
      </ul>
    </div>
  );
}
