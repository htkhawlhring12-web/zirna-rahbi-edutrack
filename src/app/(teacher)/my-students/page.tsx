import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CLASS_LABELS } from "@/lib/constants";

export default async function MyStudentsPage() {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "TEACHER", "ASSISTANT"].includes(user.role)) {
    redirect("/login");
  }

  // Admin and assistants see the full roster (assistants help with
  // attendance across the centre, not one subject); teachers see only
  // the students they're assigned to teach a subject.
  const students =
    user.role === "TEACHER"
      ? await db.student.findMany({
          where: {
            isActive: true,
            subjects: { some: { teacherId: user.id } },
          },
          include: { subjects: { include: { subject: true } } },
          orderBy: [{ classLevel: "asc" }, { fullName: "asc" }],
        })
      : await db.student.findMany({
          where: { isActive: true },
          include: { subjects: { include: { subject: true } } },
          orderBy: [{ classLevel: "asc" }, { fullName: "asc" }],
        });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-lg font-semibold text-slate-900">My Students</h1>
      <p className="mt-1 text-sm text-slate-500">
        {students.length} student{students.length === 1 ? "" : "s"}
      </p>

      <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {students.map((s) => (
          <li key={s.id} className="px-4 py-3">
            <p className="text-sm font-medium text-slate-900">{s.fullName}</p>
            <p className="text-xs text-slate-500">
              {CLASS_LABELS[s.classLevel]}
              {s.subjects.length > 0
                ? ` · ${s.subjects.map((ss) => ss.subject.name).join(", ")}`
                : ""}
            </p>
          </li>
        ))}
        {students.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-400">
            No students assigned to you yet.
          </li>
        )}
      </ul>
    </main>
  );
}
