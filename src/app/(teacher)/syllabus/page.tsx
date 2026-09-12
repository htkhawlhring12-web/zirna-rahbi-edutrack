import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CLASS_LABELS } from "@/lib/constants";
import { ChapterProgressChecklist } from "@/components/forms/chapter-progress-checklist";

export default async function SyllabusPage() {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "TEACHER", "ASSISTANT"].includes(user.role)) redirect("/login");

  const assignments = await db.studentSubject.findMany({
    where: user.role === "ADMIN" ? {} : { teacherId: user.id },
    include: { subject: true, student: { select: { classLevel: true } } },
  });

  const seen = new Set<string>();
  const options = assignments
    .map((a) => ({
      subjectId: a.subjectId,
      subjectName: a.subject.name,
      classLevel: a.student.classLevel,
      classLabel: CLASS_LABELS[a.student.classLevel],
    }))
    .filter((o) => {
      const key = `${o.subjectId}-${o.classLevel}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-lg font-semibold text-slate-900">Syllabus Progress</h1>
      <p className="mt-1 text-sm text-slate-500">
        Mark chapters as covered as you teach them.
      </p>
      <div className="mt-6">
        <ChapterProgressChecklist options={options} />
      </div>
    </main>
  );
}