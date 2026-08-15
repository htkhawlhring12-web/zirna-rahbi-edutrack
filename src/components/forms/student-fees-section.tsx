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

function RecordPaymentRow({
  payment,
  onDeleted,
}: {
  payment: FeePayment;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "pay" | "edit">("view");
  const [amountPaid, setAmountPaid] = useState(String(payment.amountPaid || payment.amountDue));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [editAmountDue, setEditAmountDue] = useState(String(payment.amountDue));
  const [editDueDate, setEditDueDate] = useState(payment.dueDate.slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveStatus = getEffectiveFeeStatus({
    status: payment.status,
    dueDate: new Date(payment.dueDate),
    amountDue: payment.amountDue,
    amountPaid: payment.amountPaid,
  });

  async function handleSavePayment(e: FormEvent) {
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

    setMode("view");
    router.refresh();
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/fee-payments/${payment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountDue: editAmountDue,
        dueDate: editDueDate,
        amountPaid: payment.amountPaid,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Could not save the changes.");
      return;
    }

    setMode("view");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this fee due? This cannot be undone.")) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/fee-payments/${payment.id}`, {
      method: "DELETE",
    });

    setLoading(false);

    if (!res.ok) {
      setError("Could not delete this fee due.");
      return;
    }

    onDeleted(payment.id);
    router.refresh();
  }

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-900">
            ₹{payment.amountDue} due {new Date(payment.dueDate).toLocaleDateString('en-GB')}
          </p>
          <p className="text-xs text-slate-500">
            {payment.amountPaid > 0
              ? `₹${payment.amountPaid} paid${payment.paidDate ? ` on ${new Date(payment.paidDate).toLocaleDateString('en-GB')}` : ""}`
              : "No payment recorded yet"}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
              onClick={() => setMode((m) => (m === "pay" ? "view" : "pay"))}
              className="text-xs font-medium text-slate-600 underline hover:text-slate-900"
            >
              {mode === "pay" ? "Cancel" : "Record payment"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode((m) => (m === "edit" ? "view" : "edit"))}
            className="text-xs font-medium text-slate-600 underline hover:text-slate-900"
          >
            {mode === "edit" ? "Cancel" : "Edit"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="text-xs font-medium text-red-600 underline hover:text-red-800 disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </div>

      {mode === "pay" && (
        <form onSubmit={handleSavePayment} className="mt-3 flex flex-wrap items-end gap-2">
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
        </form>
      )}

      {mode === "edit" && (
        <form onSubmit={handleSaveEdit} className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Amount due
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={editAmountDue}
              onChange={(e) => setEditAmountDue(e.target.value)}
              className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Due date
            </label>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
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
        </form>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
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

  function handleDeleted(id: string) {
    setPayments((prev) => prev.filter((p) => p.id !== id));
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
          <RecordPaymentRow key={p.id} payment={p} onDeleted={handleDeleted} />
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