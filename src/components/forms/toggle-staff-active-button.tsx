"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ToggleStaffActiveButton({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const action = isActive ? "deactivate this staff account" : "reactivate this staff account";
    if (!confirm(`Are you sure you want to ${action}?`)) return;

    setLoading(true);
    const res = await fetch(`/api/users/${userId}/toggle-active`, {
      method: "PATCH",
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "Could not update this account's status.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
    >
      {loading ? "Saving..." : isActive ? "Deactivate" : "Reactivate"}
    </button>
  );
}