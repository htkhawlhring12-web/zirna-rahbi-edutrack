"use client";

import { useState, useEffect, useCallback } from "react";

type Option = { subjectId: string; subjectName: string; classLevel: string; classLabel: string };
type Chapter = {
  id: string;
  title: string;
  progress: { completedAt: string | null } | null;
};
type Unit = { id: string; title: string; chapters: Chapter[] };

export function ChapterProgressChecklist({ options }: { options: Option[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const selected = options[selectedIndex];

  const loadUnits = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    const res = await fetch(
      `/api/units?subjectId=${selected.subjectId}&classLevel=${selected.classLevel}`
    );
    const data = await res.json();
    setLoading(false);
    if (res.ok) setUnits(data.units);
  }, [selected]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  async function handleToggle(chapterId: string, completed: boolean) {
    setSavingId(chapterId);
    const res = await fetch(`/api/chapters/${chapterId}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    setSavingId(null);
    if (res.ok) {
      loadUnits();
    } else {
      alert("Could not update this chapter's status.");
    }
  }

  if (options.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        You are not assigned to teach any subject/class yet.
      </p>
    );
  }

  return (
    <div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">
          Subject &amp; Class
        </label>
        <select
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {options.map((o, i) => (
            <option key={`${o.subjectId}-${o.classLevel}`} value={i}>
              {o.subjectName} · {o.classLabel}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 space-y-4">
        {loading && <p className="text-sm text-slate-400">Loading...</p>}
        {!loading && units.map((unit) => {
          const total = unit.chapters.length;
          const done = unit.chapters.filter((c) => c.progress?.completedAt).length;
          return (
            <div key={unit.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">{unit.title}</p>
              <p className="text-xs text-slate-500">
                {done} of {total} chapter{total === 1 ? "" : "s"} completed
              </p>
              <ul className="mt-3 divide-y divide-slate-100">
                {unit.chapters.map((c) => {
                  const isDone = !!c.progress?.completedAt;
                  return (
                    <li key={c.id} className="flex items-center gap-3 py-2">
                      <input
                        type="checkbox"
                        checked={isDone}
                        disabled={savingId === c.id}
                        onChange={(e) => handleToggle(c.id, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className={`text-sm ${isDone ? "text-slate-400 line-through" : "text-slate-900"}`}>
                        {c.title}
                      </span>
                    </li>
                  );
                })}
                {unit.chapters.length === 0 && (
                  <li className="py-2 text-xs text-slate-400">No chapters yet.</li>
                )}
              </ul>
            </div>
          );
        })}
        {!loading && units.length === 0 && (
          <p className="text-sm text-slate-400">No units added yet for this subject/class.</p>
        )}
      </div>
    </div>
  );
}