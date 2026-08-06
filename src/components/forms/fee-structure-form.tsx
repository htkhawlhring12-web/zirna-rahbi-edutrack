"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CLASS_OPTIONS } from "@/lib/constants";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function FeeStructureForm() {
  const router = useRouter();
  const [classLevel, setClassLevel] = useState(CLASS_OPTIONS[0].value);
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [effectiveFrom, setEffectiveFrom] = useState(todayIso());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/fee-structures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classLevel, amount, billingCycle, effectiveFrom }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(
        typeof data.error === "string" ? data.error : "Could not save the fee structure."
      );
      return;
    }

    setAmount("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="classLevel">
          Class
        </label>
        <select
          id="classLevel"
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
        <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="amount">
          Amount
        </label>
        <input
          id="amount"
          type="number"
          min="0"
          step="1"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="billingCycle">
          Billing cycle
        </label>
        <select
          id="billingCycle"
          value={billingCycle}
          onChange={(e) => setBillingCycle(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        >
          <option value="MONTHLY">Monthly</option>
          <option value="TERM">Per term</option>
          <option value="ANNUAL">Annual</option>
        </select>
      </div>

      <div>
        <label
          className="mb-1 block text-xs font-medium text-slate-700"
          htmlFor="effectiveFrom"
        >
          Effective from
        </label>
        <input
          id="effectiveFrom"
          type="date"
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Saving..." : "Set fee"}
      </button>

      {error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
