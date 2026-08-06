"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CLASS_OPTIONS } from "@/lib/constants";

type Subject = { id: string; name: string };
type Staff = { id: string; fullName: string; role: string };

export function BulkAssignSubjectForm({
  subjects,
  staff,
}: {
  subjects: Subject[];
  staff: Staff[];
}) {
  const router = useRouter();
  const [classLevel, setClassLevel] = useState(CLASS_OPTIONS[0].value);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const res = await fetch("/api/students/bulk-assign-subject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classLevel, subjectId, teacherId: teacherId || undefined }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(
        typeof data.error === "string" ? data.error : "Could not bulk-assign the subject."
      );
      return;
    }

    setResult(
      `Assigned to ${data.assignedCount} student(s)` +
        (data.skippedCount > 0 ? ` (${data.skippedCount} already had it)` : "")
    );
    router.refresh();
  }

  if (subjects.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No subjects exist yet — run `npm run db:seed`.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="bulkClassLevel">
          Class
        </label>
        <select
          id="bulkClassLevel"
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
        <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="bulkSubjectId">
          Subject
        </label>
        <select
          id="bulkSubjectId"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="bulkTeacherId">
          Teacher (optional)
        </label>
        <select
          id="bulkTeacherId"
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        >
          <option value="">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName} ({s.role})
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Assigning..." : "Assign to whole class"}
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
