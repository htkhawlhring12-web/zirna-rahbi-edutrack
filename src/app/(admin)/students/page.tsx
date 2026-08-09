import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ClassLevel } from "@prisma/client";
import { CLASS_LABELS, CLASS_OPTIONS } from "@/lib/constants";
import { BulkAssignSubjectForm } from "@/components/forms/bulk-assign-subject-form";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ classLevel?: string; section?: string; q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "ASSISTANT")) redirect("/login");

  const { classLevel, section, q } = await searchParams;

  const [allSections, students, subjects, staff] = await Promise.all([
    db.student.findMany({
      where: { section: { not: null } },
      select: { section: true },
      distinct: ["section"],
      orderBy: { section: "asc" },
    }),
    db.student.findMany({
      where: {
        ...(classLevel && classLevel in CLASS_LABELS
          ? { classLevel: classLevel as ClassLevel }
          : {}),
        ...(section ? { section } : {}),
        ...(q ? { fullName: { contains: q, mode: "insensitive" } } : {}),
      },
      orderBy: [{ classLevel: "asc" }, { fullName: "asc" }],
    }),
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { role: { in: ["ADMIN", "TEACHER", "ASSISTANT"] } },
      orderBy: { fullName: "asc" },
    }),
  ]);

  const selectClass =
    "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Students</h1>
          <p className="mt-1 text-sm text-slate-500">
            {students.length} student{students.length === 1 ? "" : "s"}
            {classLevel || section || q ? " matching filters" : " enrolled"}
          </p>
        </div>
        <Link
          href="/students/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Add student
        </Link>
      </div>

      <form method="GET" className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="filterClass">
            Class
          </label>
          <select
            id="filterClass"
            name="classLevel"
            defaultValue={classLevel ?? ""}
            className={selectClass}
          >
            <option value="">All classes</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {allSections.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="filterSection">
              Section
            </label>
            <select
              id="filterSection"
              name="section"
              defaultValue={section ?? ""}
              className={selectClass}
            >
              <option value="">All sections</option>
              {allSections.map((s) => (
                <option key={s.section} value={s.section!}>
                  {s.section}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="filterQ">
            Search by name
          </label>
          <input
            id="filterQ"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Student name"
            className={selectClass}
          />
        </div>

        <button
          type="submit"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Filter
        </button>
        {(classLevel || section || q) && (
          <Link
            href="/students"
            className="text-sm font-medium text-slate-500 underline hover:text-slate-900"
          >
            Clear
          </Link>
        )}
      </form>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-slate-700">
          Bulk-assign a subject to a whole class
        </h2>
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-4">
          <BulkAssignSubjectForm subjects={subjects} staff={staff} />
        </div>
      </section>

      <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {students.map((s) => (
          <li key={s.id}>
            <Link
              href={`/students/${s.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {s.fullName}
                  {!s.isActive && (
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      (inactive)
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {CLASS_LABELS[s.classLevel]}
                  {s.section ? ` · ${s.section}` : ""}
                </p>
              </div>
              <span className="text-slate-300">→</span>
            </Link>
          </li>
        ))}
        {students.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-400">
            {classLevel || section || q
              ? "No students match these filters."
              : "No students yet. Add your first one above."}
          </li>
        )}
      </ul>
    </main>
  );
}