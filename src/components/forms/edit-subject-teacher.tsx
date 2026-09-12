"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Staff = { id: string; fullName: string; role: string };

export function EditSubjectTeacher({
  studentId,
  studentSubjectId,
  currentTeacherId,
  staff,
}: {
  studentId: string;
  studentSubjectId: string;
  currentTeacherId: string | null;
  staff: Staff[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [teacherId, setTeacherId] = useState(currentTeacherId ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    const res = await fetch(`/api/students/${studentId}/subjects`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentSubjectId, teacherId: teacherId || undefined }),
    });
    setLoading(false);

    if (!res.ok) {
      alert("Could not update the teacher for this subject.");
      return;
    }

    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs font-medium text-slate-500 underline hover:text-slate-900"
      >
        Change teacher
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={teacherId}
        onChange={(e) => setTeacherId(e.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      >
        <option value="">Unassigned</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.fullName} ({s.role})
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs text-slate-500 hover:text-slate-900"
      >
        Cancel
      </button>
    </div>
  );
}