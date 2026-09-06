"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CLASS_OPTIONS } from "@/lib/constants";

export function BulkReportCardForm() {
  const router = useRouter();
  const [classLevel, setClassLevel] = useState(CLASS_OPTIONS[0].value);
  const [periodLabel, setPeriodLabel] = useState("");
  const [sinceDate, setSinceDate] = useState("");
  const [untilDate, setUntilDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ studentName: string; success: boolean }[] | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSummary(null);
    setLoading(true);

    const res = await fetch("/api/students/bulk-report-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classLevel,
        periodLabel,
        sinceDate: sinceDate || undefined,
        untilDate: untilDate || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not generate report cards.");
      return;
    }

    setSummary(data.results);
    router.refresh();
  }

  const successCount = summary?.filter((r) => r.success).length ?? 0;
  const failCount = summary ? summary.length - successCount : 0;

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="brcClass">
            Class
          </label>
          <select
            id="brcClass"
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
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="brcPeriod">
            Period label
          </label>
          <input
            id="brcPeriod"
            required
            placeholder="e.g. September 2026 Monthly Report"
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
            className="w-56 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="brcSince">
            From (optional)
          </label>
          <input
            id="brcSince"
            type="date"
            value={sinceDate}
            onChange={(e) => setSinceDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="brcUntil">
            To (optional)
          </label>
          <input
            id="brcUntil"
            type="date"
            value={untilDate}
            onChange={(e) => setUntilDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Generating..." : "Generate for whole class"}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {summary && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-sm font-medium text-slate-900">
            {successCount} generated{failCount > 0 ? `, ${failCount} failed` : ""}
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
            {summary.map((r, i) => (
              <li key={i} className={r.success ? "" : "text-red-600"}>
                {r.studentName} {r.success ? "✓" : "— failed"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}