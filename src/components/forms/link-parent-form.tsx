"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LinkParentForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("Father");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(
    null
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);
    setLoading(true);

    const res = await fetch(`/api/students/${studentId}/parents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, phone, relationship, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(
        typeof data.error === "string"
          ? data.error
          : "Could not create the parent account."
      );
      return;
    }

    setCreated({ email, password });
    setFullName("");
    setEmail("");
    setPhone("");
    setPassword("");
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="parentName">
            Parent name
          </label>
          <input
            id="parentName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="parentEmail">
            Email
          </label>
          <input
            id="parentEmail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="parent.name@zirnarahbi.local"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="parentPhone">
            Phone
          </label>
          <input
            id="parentPhone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="relationship">
            Relationship
          </label>
          <select
            id="relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option>Father</option>
            <option>Mother</option>
            <option>Guardian</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="parentPassword">
            Password to give the parent
          </label>
          <input
            id="parentPassword"
            type="text"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Creating..." : "Add parent"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {created && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">Parent account created.</p>
          <p className="mt-1 text-sm text-emerald-700">
            Share these login details with the parent directly (in person, on
            paper, etc). They can log in right away with this email and
            password.
          </p>
          <p className="mt-2 rounded bg-white px-2 py-1 text-xs text-slate-600">
            Email: {created.email}
          </p>
          <p className="mt-1 rounded bg-white px-2 py-1 text-xs text-slate-600">
            Password: {created.password}
          </p>
        </div>
      )}
    </div>
  );
}
