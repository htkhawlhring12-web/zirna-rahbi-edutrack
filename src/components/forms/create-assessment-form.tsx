"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CLASS_OPTIONS } from "@/lib/constants";

type Subject = { id: string; name: string };

const TYPE_OPTIONS = [
  { value: "WEEKLY_TEST", label: "Weekly Test" },
  { value: "MONTHLY_TEST", label: "Monthly Test" },
  { value: "EXAM", label: "Exam" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateAssessmentForm({ subjects }: { subjects: Subject[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [classLevel, setClassLevel] = useState(CLASS_OPTIONS[0].value);
  const [assessmentType, setAssessmentType] = useState("WEEKLY_TEST");
  const [maxMarks, setMaxMarks] = useState("100");
  const [date, setDate] = useState(todayIso());
  const [chapterTopic, setChapterTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        subjectId,
        classLevel,
        assessmentType,
        maxMarks,
        date,
        chapterTopic: chapterTopic || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(
        typeof data.error === "string" ? data.error : "Could not create the assessment."
      );
      return;
    }

    router.push(`/marks-entry/${data.assessment.id}`);
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
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            required
            placeholder="e.g. Weekly Test 3 - Algebra"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="subjectId">
            Subject
          </label>
          <select
            id="subjectId"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="classLevel">
            Class
          </label>
          <select
            id="classLevel"
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            {CLASS_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium text-slate-700"
            htmlFor="assessmentType"
          >
            Type
          </label>
          <select
            id="assessmentType"
            value={assessmentType}
            onChange={(e) => setAssessmentType(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="maxMarks">
            Max marks
          </label>
          <input
            id="maxMarks"
            type="number"
            min="1"
            step="0.5"
            required
            value={maxMarks}
            onChange={(e) => setMaxMarks(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium text-slate-700"
            htmlFor="chapterTopic"
          >
            Chapter/topic (optional)
          </label>
          <input
            id="chapterTopic"
            placeholder="e.g. Quadratic Equations"
            value={chapterTopic}
            onChange={(e) => setChapterTopic(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create & enter marks"}
      </button>
    </form>
  );
}
