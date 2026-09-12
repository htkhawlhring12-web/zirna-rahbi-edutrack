"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { CLASS_OPTIONS } from "@/lib/constants";

type Subject = { id: string; name: string };
type Chapter = {
  id: string;
  title: string;
  progress: { completedAt: string | null; teacher: { fullName: string } | null } | null;
};
type Unit = { id: string; title: string; chapters: Chapter[] };

export function ManageChaptersForm({ subjects }: { subjects: Subject[] }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [classLevel, setClassLevel] = useState(CLASS_OPTIONS[0].value);
  const [unitTitle, setUnitTitle] = useState("");
  const [chapterTitles, setChapterTitles] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  const loadUnits = useCallback(async () => {
    if (!subjectId || !classLevel) return;
    setListLoading(true);
    const res = await fetch(`/api/units?subjectId=${subjectId}&classLevel=${classLevel}`);
    const data = await res.json();
    setListLoading(false);
    if (res.ok) setUnits(data.units);
  }, [subjectId, classLevel]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  async function handleAddUnit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, classLevel, title: unitTitle }),
    });
    setLoading(false);
    if (res.ok) {
      setUnitTitle("");
      loadUnits();
    } else {
      alert("Could not add the unit.");
    }
  }

  async function handleDeleteUnit(id: string) {
    if (!confirm("Delete this unit and all its chapters?")) return;
    const res = await fetch(`/api/units/${id}`, { method: "DELETE" });
    if (res.ok) loadUnits();
    else alert("Could not delete this unit.");
  }

  async function handleAddChapter(unitId: string) {
    const title = chapterTitles[unitId];
    if (!title) return;
    const res = await fetch("/api/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitId, title }),
    });
    if (res.ok) {
      setChapterTitles((prev) => ({ ...prev, [unitId]: "" }));
      loadUnits();
    } else {
      alert("Could not add the chapter.");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Subject</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Class</label>
          <select
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {CLASS_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleAddUnit} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Unit title</label>
          <input
            required
            value={unitTitle}
            onChange={(e) => setUnitTitle(e.target.value)}
            placeholder="e.g. Unit 1 - Number Systems"
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add unit"}
        </button>
      </form>

      <div className="mt-4 space-y-4">
        {listLoading && <p className="text-sm text-slate-400">Loading...</p>}
        {!listLoading && units.map((unit) => {
          const total = unit.chapters.length;
          const done = unit.chapters.filter((c) => c.progress?.completedAt).length;
          return (
            <div key={unit.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{unit.title}</p>
                  <p className="text-xs text-slate-500">
                    {done} of {total} chapter{total === 1 ? "" : "s"} completed
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteUnit(unit.id)}
                  className="text-xs font-medium text-red-600 underline hover:text-red-800"
                >
                  Delete unit
                </button>
              </div>

              <ul className="mt-3 divide-y divide-slate-100">
                {unit.chapters.map((c) => (
                  <li key={c.id} className="py-2">
                    <p className="text-sm text-slate-900">{c.title}</p>
                    <p className="text-xs text-slate-500">
                      {c.progress?.completedAt
                        ? `Completed ${new Date(c.progress.completedAt).toLocaleDateString('en-GB')}${c.progress.teacher ? ` by ${c.progress.teacher.fullName}` : ""}`
                        : "Not yet completed"}
                    </p>
                  </li>
                ))}
                {unit.chapters.length === 0 && (
                  <li className="py-2 text-xs text-slate-400">No chapters yet.</li>
                )}
              </ul>

              <div className="mt-2 flex gap-2">
                <input
                  value={chapterTitles[unit.id] ?? ""}
                  onChange={(e) =>
                    setChapterTitles((prev) => ({ ...prev, [unit.id]: e.target.value }))
                  }
                  placeholder="e.g. Chapter 1 - Real Numbers"
                  className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                />
                <button
                  onClick={() => handleAddChapter(unit.id)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Add chapter
                </button>
              </div>
            </div>
          );
        })}
        {!listLoading && units.length === 0 && (
          <p className="text-sm text-slate-400">No units added yet for this subject/class.</p>
        )}
      </div>
    </div>
  );
}