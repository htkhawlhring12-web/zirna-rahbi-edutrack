"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CLASS_OPTIONS } from "@/lib/constants";

export function CreateSubjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function toggleClass(value: string) {
    setSelectedClasses((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, applicableClasses: selectedClasses }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(
        typeof data.error === "string"
          ? data.error
          : "Could not create the subject."
      );
      return;
    }

    setSuccess(true);
    setName("");
    setSelectedClasses([]);
    router.refresh();
  }

  return (
    <div>
      <h2 className="text-sm font-medium text-slate-700">Add a subject</h2>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="subjectName">
            Subject name
          </label>
          <input
            id="subjectName"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mathematics"
            className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-slate-700">Applies to which classes?</p>
          <div className="flex flex-wrap gap-3">
            {CLASS_OPTIONS.map((c) => (
              <label key={c.value} className="flex items-center gap-1.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedClasses.includes(c.value)}
                  onChange={() => toggleClass(c.value)}
                  className="rounded border-slate-300"
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">Subject added.</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add subject"}
        </button>
      </form>
    </div>
  );
}