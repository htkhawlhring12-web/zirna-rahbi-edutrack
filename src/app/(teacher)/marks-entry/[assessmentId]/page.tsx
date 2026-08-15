import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CLASS_LABELS } from "@/lib/constants";
import { MarksEntryForm } from "@/components/forms/marks-entry-form";

export default async function AssessmentMarksPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "TEACHER"].includes(user.role)) redirect("/login");

  const { assessmentId } = await params;

  const assessment = await db.assessment.findUnique({
    where: { id: assessmentId },
    include: { subject: true },
  });
  if (!assessment) notFound();

  const eligibleStudents = await db.studentSubject.findMany({
    where: {
      subjectId: assessment.subjectId,
      student: { classLevel: assessment.classLevel, isActive: true },
    },
    include: { student: true },
    orderBy: { student: { fullName: "asc" } },
  });

  const existingMarks = await db.assessmentMark.findMany({
    where: { assessmentId },
  });
  const byStudent = new Map<string, (typeof existingMarks)[number]>(
    existingMarks.map((m) => [m.studentId, m])
  );

  const students = eligibleStudents.map((ss) => {
    const mark = byStudent.get(ss.studentId);
    return {
      id: ss.student.id,
      fullName: ss.student.fullName,
      marksObtained: mark ? Number(mark.marksObtained) : null,
      remarks: mark?.remarks ?? "",
    };
  });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-lg font-semibold text-slate-900">{assessment.title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {assessment.subject.name} · {CLASS_LABELS[assessment.classLevel]} · Max
        marks {Number(assessment.maxMarks)} ·{" "}
        {new Date(assessment.date).toLocaleDateString('en-GB')}
      </p>

      <div className="mt-6">
        <MarksEntryForm
          assessmentId={assessment.id}
          maxMarks={Number(assessment.maxMarks)}
          initialStudents={students}
        />
      </div>
    </main>
  );
}
