"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CLASS_OPTIONS } from "@/lib/constants";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function BulkFeeDueForm() {
  const router = useRouter();
  const [classLevel, setClassLevel] = useState(CLASS_OPTIONS[0].value);
  const [amountDue, setAmountDue] = useState("");
  const [dueDate, setDueDate] = useState(todayIso());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const res = await fetch("/api/fee-payments/bulk-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classLevel, amountDue, dueDate }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(
        typeof data.error === "string" ? data.error : "Could not create the fee dues."
      );
      return;
    }

    setResult(`Created a due for ${data.createdCount} student(s).`);
    setAmountDue("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="bulkFeeClass">
          Class
        </label>
        <select
          id="bulkFeeClass"
          value={classLevel}
          onChange={(e) => setClassLevel(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        >
          {CLASS_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="bulkFeeAmount">
          Amount due
        </label>
        <input
          id="bulkFeeAmount"
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
        <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="bulkFeeDueDate">
          Due date
        </label>
        <input
          id="bulkFeeDueDate"
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
        {loading ? "Creating..." : "Add due to whole class"}
      </button>

      {error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {error}
        </p>
      )}
      {result && <p className="w-full text-sm text-emerald-700">{result}</p>}
    </form>
  );
}
