"use client";

import { useEffect, useState } from "react";
import { CLASS_OPTIONS } from "@/lib/constants";

type Subject = { id: string; name: string };
type StudentRow = { id: string; fullName: string; status: string | null };

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
  { value: "EXCUSED", label: "Excused" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AttendanceMarking({ subjects }: { subjects: Subject[] }) {
  const [date, setDate] = useState(todayIso());
  const [classLevel, setClassLevel] = useState(CLASS_OPTIONS[0].value);
  const [subjectId, setSubjectId] = useState(""); // "" = whole-day
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ date, classLevel });
      if (subjectId) params.set("subjectId", subjectId);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      const data = await res.json();
      if (cancelled) return;

      setLoading(false);
      if (!res.ok) {
        setError("Could not load students for this class.");
        return;
      }
      setStudents(data.students);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [date, classLevel, subjectId]);

  function setStatus(studentId: string, status: string) {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  }

  function markAllPresent() {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "PRESENT" })));
  }

  async function copyPreviousDay() {
    setCopying(true);
    setError(null);

    const params = new URLSearchParams({ classLevel, beforeDate: date });
    if (subjectId) params.set("subjectId", subjectId);

    const res = await fetch(`/api/attendance/previous?${params.toString()}`);
    const data = await res.json();
    setCopying(false);

    if (!res.ok) {
      setError("Could not look up the previous day's attendance.");
      return;
    }
    if (!data.date) {
      setError("No earlier attendance found for this class/subject to copy from.");
      return;
    }

    const byStudent = new Map(
      data.records.map((r: { studentId: string; status: string }) => [r.studentId, r.status])
    );
    setStudents((prev) =>
      prev.map((s) => ({ ...s, status: (byStudent.get(s.id) as string) ?? s.status }))
    );
  }

  async function handleSave() {
    const unmarked = students.filter((s) => !s.status);
    if (unmarked.length > 0) {
      setError(
        `${unmarked.length} student(s) don't have a status yet. Mark everyone before saving.`
      );
      return;
    }

    setSaving(true);
    setError(null);

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        subjectId: subjectId || null,
        records: students.map((s) => ({ studentId: s.id, status: s.status })),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      setError("Could not save attendance. Please try again.");
      return;
    }

    setSavedAt(Date.now());
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

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
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="subjectId">
            Subject
          </label>
          <select
            id="subjectId"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">Whole day</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {students.length > 0 && (
          <button
            type="button"
            onClick={markAllPresent}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Mark all present
          </button>
        )}

        {students.length > 0 && (
          <button
            type="button"
            onClick={copyPreviousDay}
            disabled={copying}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {copying ? "Copying..." : "Copy previous day"}
          </button>
        )}
      </div>

      {loading && (
        <p className="mt-4 text-sm text-slate-400">Loading students...</p>
      )}

      {!loading && students.length === 0 && (
        <p className="mt-4 text-sm text-slate-400">
          No active students in this class.
        </p>
      )}

      {!loading && students.length > 0 && (
        <div className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {students.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <p className="text-sm font-medium text-slate-900">{s.fullName}</p>
              <div className="flex gap-1">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(s.id, opt.value)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      s.status === opt.value
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {students.length > 0 && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save attendance"}
        </button>
      )}

      {savedAt && (
        <p className="mt-2 text-sm text-emerald-700">
          Attendance saved.
        </p>
      )}
    </div>
  );
}
