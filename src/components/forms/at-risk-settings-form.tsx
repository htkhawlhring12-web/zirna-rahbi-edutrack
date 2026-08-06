"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Config = {
  attendanceWindowDays: number;
  attendanceThresholdPercent: number;
  averageRecentCount: number;
  averageThresholdPercent: number;
  consecutiveAbsencesThreshold: number;
  trendWindowCount: number;
  trendDeclineThresholdPoints: number;
};

const FIELDS: { key: keyof Config; label: string; help: string }[] = [
  {
    key: "attendanceThresholdPercent",
    label: "Low attendance threshold (%)",
    help: "Flag a student if their attendance rate drops below this.",
  },
  {
    key: "attendanceWindowDays",
    label: "Attendance window (days)",
    help: "How many trailing days the attendance rate is calculated over.",
  },
  {
    key: "averageThresholdPercent",
    label: "Low average threshold (%)",
    help: "Flag a student if their recent average drops below this.",
  },
  {
    key: "averageRecentCount",
    label: "Recent assessments counted",
    help: "How many of the most recent assessments feed the average check.",
  },
  {
    key: "consecutiveAbsencesThreshold",
    label: "Consecutive absences",
    help: "This many ABSENT days in a row triggers the flag.",
  },
  {
    key: "trendWindowCount",
    label: "Trend comparison size",
    help: "Compares the average of the last N assessments per subject against the N before.",
  },
  {
    key: "trendDeclineThresholdPoints",
    label: "Decline threshold (points)",
    help: "A drop of at least this many percentage points counts as declining.",
  },
];

export function AtRiskSettingsForm({ initialConfig }: { initialConfig: Config }) {
  const router = useRouter();
  const [values, setValues] = useState(initialConfig);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function setField(key: keyof Config, value: string) {
    setValues((prev) => ({ ...prev, [key]: value === "" ? 0 : Number(value) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/settings/at-risk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Could not save the thresholds. Check the values and try again.");
      return;
    }

    setSavedAt(Date.now());
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor={field.key}
            >
              {field.label}
            </label>
            <input
              id={field.key}
              type="number"
              min="0"
              value={values[field.key]}
              onChange={(e) => setField(field.key, e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
            <p className="mt-1 text-xs text-slate-400">{field.help}</p>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save thresholds"}
      </button>

      {savedAt && (
        <p className="text-sm text-emerald-700">
          Saved — takes effect immediately on the dashboard.
        </p>
      )}
    </form>
  );
}
