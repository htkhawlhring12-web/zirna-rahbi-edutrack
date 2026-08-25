"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteAssessmentButton({
  assessmentId,
  assessmentTitle,
}: {
  assessmentId: string;
  assessmentTitle: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/assessments/${assessmentId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        typeof data.error === "string"
          ? data.error
          : "Could not delete this assessment."
      );
      setLoading(false);
      return;
    }

    router.refresh();
  }

  function handleConfirmClick(e: React.MouseEvent) {
    e.preventDefault();
    setConfirming(true);
  }

  function handleCancelClick(e: React.MouseEvent) {
    e.preventDefault();
    setConfirming(false);
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={handleConfirmClick}
        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-600">Delete &quot;{assessmentTitle}&quot;?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "..." : "Yes"}
        </button>
        <button
          type="button"
          onClick={handleCancelClick}
          disabled={loading}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}