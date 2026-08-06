"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StudentRow = {
  id: string;
  fullName: string;
  marksObtained: number | null;
  remarks: string;
};

export function MarksEntryForm({
  assessmentId,
  maxMarks,
  initialStudents,
}: {
  assessmentId: string;
  maxMarks: number;
  initialStudents: StudentRow[];
}) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function setMarks(studentId: string, value: string) {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, marksObtained: value === "" ? null : Number(value) }
          : s
      )
    );
  }

  function setRemarks(studentId: string, value: string) {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, remarks: value } : s))
    );
  }

  async function handleSave() {
    const missing = students.filter((s) => s.marksObtained === null);
    if (missing.length > 0) {
      setError(
        `${missing.length} student(s) don't have marks entered yet. Fill in every row before saving.`
      );
      return;
    }
    const overMax = students.filter(
      (s) => (s.marksObtained ?? 0) > maxMarks
    );
    if (overMax.length > 0) {
      setError(`Marks can't exceed the max marks (${maxMarks}).`);
      return;
    }

    setSaving(true);
    setError(null);

    const res = await fetch(`/api/assessments/${assessmentId}/marks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        records: students.map((s) => ({
          studentId: s.id,
          marksObtained: s.marksObtained,
          remarks: s.remarks || undefined,
        })),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Could not save marks.");
      return;
    }

    setSavedAt(Date.now());
    router.refresh();
  }

  if (students.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No students take this subject in this class yet. Assign the subject
        to students first, from each student&rsquo;s page.
      </p>
    );
  }

  return (
    <div>
      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-[1fr_100px_1fr] gap-3 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">
          <span>Student</span>
          <span>Marks (/ {maxMarks})</span>
          <span>Remarks (optional)</span>
        </div>
        {students.map((s) => (
          <div
            key={s.id}
            className="grid grid-cols-[1fr_100px_1fr] items-center gap-3 px-4 py-3"
          >
            <p className="text-sm font-medium text-slate-900">{s.fullName}</p>
            <input
              type="number"
              min="0"
              max={maxMarks}
              step="0.5"
              value={s.marksObtained ?? ""}
              onChange={(e) => setMarks(s.id, e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
            <input
              type="text"
              value={s.remarks}
              onChange={(e) => setRemarks(s.id, e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save marks"}
      </button>

      {savedAt && <p className="mt-2 text-sm text-emerald-700">Marks saved.</p>}
    </div>
  );
}
