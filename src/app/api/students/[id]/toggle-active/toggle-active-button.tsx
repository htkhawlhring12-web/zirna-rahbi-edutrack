"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ToggleActiveButton({
  studentId,
  isActive,
}: {
  studentId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const action = isActive ? "mark this student as inactive" : "reactivate this student";
    if (!confirm(`Are you sure you want to ${action}?`)) return;

    setLoading(true);
    const res = await fetch(`/api/students/${studentId}/toggle-active`, {
      method: "PATCH",
    });
    setLoading(false);

    if (!res.ok) {
      alert("Could not update this student's status.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
    >
      {loading ? "Saving..." : isActive ? "Mark as inactive" : "Reactivate"}
    </button>
  );
}