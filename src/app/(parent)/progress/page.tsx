import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLinkedStudents, resolveSelectedStudent } from "@/lib/parent-access";
import { ChildSelector } from "@/components/child-selector";
import { ProgressChart } from "@/components/charts/progress-chart";

type SubjectProgress = {
  subjectId: string;
  name: string;
  points: { label: string; percentage: number }[];
  average: number;
};

async function loadProgressData(studentId: string): Promise<SubjectProgress[]> {
  const marks = await db.assessmentMark.findMany({
    where: { studentId },
    include: { assessment: { include: { subject: true } } },
    orderBy: { assessment: { date: "asc" } },
  });

  const bySubject = new Map<string, SubjectProgress>();
  for (const m of marks) {
    const subjectId = m.assessment.subjectId;
    const entry: SubjectProgress = bySubject.get(subjectId) ?? {
      subjectId,
      name: m.assessment.subject.name,
      points: [],
      average: 0,
    };
    entry.points.push({
      label: new Date(m.assessment.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      percentage: Math.round(
        (Number(m.marksObtained) / Number(m.assessment.maxMarks)) * 100
      ),
    });
    bySubject.set(subjectId, entry);
  }

  for (const entry of bySubject.values()) {
    entry.average = Math.round(
      entry.points.reduce((sum, p) => sum + p.percentage, 0) / entry.points.length
    );
  }

  return Array.from(bySubject.values());
}

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "PARENT") redirect("/login");

  const { studentId } = await searchParams;
  const linked = await getLinkedStudents(user.id);
  const selected = resolveSelectedStudent(linked, studentId);

  if (!selected) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-lg font-semibold text-slate-900">Progress</h1>
        <p className="mt-4 text-sm text-slate-500">
          No student is linked to your account yet. Please contact the centre.
        </p>
      </main>
    );
  }

  const subjects = await loadProgressData(selected.id);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-lg font-semibold text-slate-900">Progress</h1>
      <p className="mt-1 text-sm text-slate-500">
        {selected.fullName}&rsquo;s marks over time, by subject.
      </p>

      <div className="mt-4">
        <ChildSelector basePath="/progress" linked={linked} selectedId={selected.id} />
      </div>

      <div className="mt-2 space-y-6">
        {subjects.map((s) => (
          <div key={s.subjectId} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-900">{s.name}</h2>
              <span className="text-xs text-slate-500">Average: {s.average}%</span>
            </div>
            <div className="mt-2">
              <ProgressChart data={s.points} />
            </div>
          </div>
        ))}
        {subjects.length === 0 && (
          <p className="text-sm text-slate-400">No marks recorded yet.</p>
        )}
      </div>
    </main>
  );
}
