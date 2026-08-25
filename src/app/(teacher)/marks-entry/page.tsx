import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CLASS_LABELS } from "@/lib/constants";
import { CreateAssessmentForm } from "@/components/forms/create-assessment-form";
import { DeleteAssessmentButton } from "@/components/forms/delete-assessment-button";

const TYPE_LABELS: Record<string, string> = {
  WEEKLY_TEST: "Weekly Test",
  MONTHLY_TEST: "Monthly Test",
  EXAM: "Exam",
};

export default async function MarksEntryPage() {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "TEACHER"].includes(user.role)) redirect("/login");

  const [subjects, assessments] = await Promise.all([
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.assessment.findMany({
      include: { subject: true, _count: { select: { marks: true } } },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-lg font-semibold text-slate-900">Marks Entry</h1>
      <p className="mt-1 text-sm text-slate-500">
        Create a weekly test, monthly test, or exam, then enter marks for each
        student.
      </p>

      <div className="mt-6">
        <CreateAssessmentForm subjects={subjects} />
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-slate-700">Recent assessments</h2>
        <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {assessments.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
              <Link href={`/marks-entry/${a.id}`} className="flex-1">
                <p className="text-sm font-medium text-slate-900">{a.title}</p>
                <p className="text-xs text-slate-500">
                  {a.subject.name} · {CLASS_LABELS[a.classLevel]} ·{" "}
                  {TYPE_LABELS[a.assessmentType]} ·{" "}
                  {new Date(a.date).toLocaleDateString('en-GB')} · Max {Number(a.maxMarks)}
                </p>
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {a._count.marks} mark{a._count.marks === 1 ? "" : "s"} entered
                </span>
                {user.role === "ADMIN" && (
                  <DeleteAssessmentButton assessmentId={a.id} assessmentTitle={a.title} />
                )}
              </div>
            </li>
          ))}
          {assessments.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">
              No assessments yet.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}