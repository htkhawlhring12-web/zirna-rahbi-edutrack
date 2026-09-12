"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { CLASS_OPTIONS } from "@/lib/constants";

type Subject = { id: string; name: string };
type Chapter = {
  id: string;
  title: string;
  progress: { completedAt: string | null; teacher: { fullName: string } | null } | null;
};

export function ManageChaptersForm({ subjects }: { subjects: Subject[] }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [classLevel, setClassLevel] = useState(CLASS_OPTIONS[0].value);
  const [title, setTitle] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  const loadChapters = useCallback(async () => {
    if (!subjectId || !classLevel) return;
    setListLoading(true);
    const res = await fetch(`/api/chapters?subjectId=${subjectId}&classLevel=${classLevel}`);
    const data = await res.json();
    setListLoading(false);
    if (res.ok) setChapters(data.chapters);
  }, [subjectId, classLevel]);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, classLevel, title }),
    });
    setLoading(false);
    if (res.ok) {
      setTitle("");
      loadChapters();
    } else {
      alert("Could not add the chapter.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this chapter?")) return;
    const res = await fetch(`/api/chapters/${id}`, { method: "DELETE" });
    if (res.ok) loadChapters();
    else alert("Could not delete this chapter.");
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

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Chapter title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chapter 1 - Real Numbers"
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add chapter"}
        </button>
      </form>

      <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {listLoading && <li className="px-4 py-3 text-sm text-slate-400">Loading...</li>}
        {!listLoading && chapters.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">{c.title}</p>
              <p className="text-xs text-slate-500">
                {c.progress?.completedAt
                  ? `Completed ${new Date(c.progress.completedAt).toLocaleDateString('en-GB')}${c.progress.teacher ? ` by ${c.progress.teacher.fullName}` : ""}`
                  : "Not yet completed"}
              </p>
            </div>
            <button
              onClick={() => handleDelete(c.id)}
              className="text-xs font-medium text-red-600 underline hover:text-red-800"
            >
              Delete
            </button>
          </li>
        ))}
        {!listLoading && chapters.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-400">
            No chapters added yet for this subject/class.
          </li>
        )}
      </ul>
    </div>
  );
}