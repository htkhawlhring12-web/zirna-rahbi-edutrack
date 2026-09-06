"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type ReportCard = { id: string; periodLabel: string; generatedAt: string };

function ReportCardRow({
  rc,
  onDeleted,
}: {
  rc: ReportCard;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${rc.periodLabel}"? This cannot be undone.`)) return;
    setLoading(true);

    const res = await fetch(`/api/report-cards/${rc.id}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      alert("Could not delete this report card.");
      return;
    }

    onDeleted(rc.id);
    router.refresh();
  }

  return (
    <li className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-900">{rc.periodLabel}</p>
        <p className="text-xs text-slate-500">
          Generated {new Date(rc.generatedAt).toLocaleDateString('en-GB')}
        </p>
      </div>
      <div className="flex items-center gap-3">
        
          href={`/api/report-cards/${rc.id}/download`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-slate-700 underline hover:text-slate-900"
        >
          Download
        </a>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="text-sm font-medium text-red-600 underline hover:text-red-800 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export function ReportCardsSection({
  studentId,
  initialReportCards,
}: {
  studentId: string;
  initialReportCards: ReportCard[];
}) {
  const router = useRouter();
  const [periodLabel, setPeriodLabel] = useState("");
  const [sinceDate, setSinceDate] = useState("");
  const [untilDate, setUntilDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportCards, setReportCards] = useState(initialReportCards);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/students/${studentId}/report-cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        periodLabel,
        sinceDate: sinceDate || undefined,
        untilDate: untilDate || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(
        typeof data.error === "string" ? data.error : "Could not generate the report card."
      );
      return;
    }

    setReportCards((prev) => [data.reportCard, ...prev]);
    setPeriodLabel("");
    setSinceDate("");
    setUntilDate("");
    router.refresh();
  }

  function handleDeleted(id: string) {
    setReportCards((prev) => prev.filter((rc) => rc.id !== id));
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="periodLabel">
            Period label
          </label>
          <input
            id="periodLabel"
            required
            placeholder="e.g. October 2026 Monthly Report"
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
            className="w-56 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="sinceDate">
            From (optional)
          </label>
          <input
            id="sinceDate"
            type="date"
            value={sinceDate}
            onChange={(e) => setSinceDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="untilDate">
            To (optional)
          </label>
          <input
            id="untilDate"
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
          {loading ? "Generating..." : "Generate report card"}
        </button>
      </form>
      <p className="mt-1 text-xs text-slate-400">
        Leave From/To blank to include every mark on record. Attendance
        defaults to the standard 30-day window when no range is given.
      </p>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {reportCards.map((rc) => (
          <ReportCardRow key={rc.id} rc={rc} onDeleted={handleDeleted} />
        ))}
        {reportCards.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-400">
            No report cards generated yet.
          </li>
        )}
      </ul>
    </div>
  );
}
