import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CLASS_LABELS } from "@/lib/constants";
import { AssignSubjectForm } from "@/components/forms/assign-subject-form";
import { LinkParentForm } from "@/components/forms/link-parent-form";
import { ReportCardsSection } from "@/components/forms/report-cards-section";
import { StudentFeesSection } from "@/components/forms/student-fees-section";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const { id } = await params;

  const [student, subjects, staff, reportCards, feePayments] = await Promise.all([
    db.student.findUnique({
      where: { id },
      include: {
        subjects: { include: { subject: true, teacher: true } },
        parentLinks: { include: { parent: true } },
      },
    }),
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { role: { in: ["ADMIN", "TEACHER", "ASSISTANT"] } },
      orderBy: { fullName: "asc" },
    }),
    db.reportCard.findMany({
      where: { studentId: id },
      orderBy: { generatedAt: "desc" },
    }),
    db.feePayment.findMany({
      where: { studentId: id },
      orderBy: { dueDate: "desc" },
    }),
  ]);

  if (!student) notFound();

  const assignedSubjectIds = new Set(student.subjects.map((s) => s.subjectId));
  const availableSubjects = subjects.filter((s) => !assignedSubjectIds.has(s.id));

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {student.fullName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {CLASS_LABELS[student.classLevel]}
            {student.section ? ` · Section ${student.section}` : ""}
            {student.schoolName ? ` · ${student.schoolName}` : ""}
          </p>
        </div>
        {!student.isActive && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            Inactive
          </span>
        )}
      </div>

      {/* Subjects */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-slate-700">Subjects</h2>
        <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {student.subjects.map((ss) => (
            <li
              key={ss.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {ss.subject.name}
                </p>
                <p className="text-xs text-slate-500">
                  {ss.teacher ? ss.teacher.fullName : "No teacher assigned"}
                </p>
              </div>
            </li>
          ))}
          {student.subjects.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">
              No subjects assigned yet.
            </li>
          )}
        </ul>

        {availableSubjects.length > 0 && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <AssignSubjectForm
              studentId={student.id}
              subjects={availableSubjects}
              staff={staff}
            />
          </div>
        )}
      </section>

      {/* Parents */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-slate-700">
          Parents / Guardians
        </h2>
        <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {student.parentLinks.map((link) => (
            <li
              key={link.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {link.parent.fullName}
                </p>
                <p className="text-xs text-slate-500">
                  {link.parent.email}
                  {link.relationship ? ` · ${link.relationship}` : ""}
                </p>
              </div>
            </li>
          ))}
          {student.parentLinks.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">
              No parent account linked yet.
            </li>
          )}
        </ul>

        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <LinkParentForm studentId={student.id} />
        </div>
      </section>

      {/* Report Cards */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-slate-700">Report Cards</h2>
        <div className="mt-3">
          <ReportCardsSection
            studentId={student.id}
            initialReportCards={reportCards.map((rc) => ({
              id: rc.id,
              periodLabel: rc.periodLabel,
              generatedAt: rc.generatedAt.toISOString(),
            }))}
          />
        </div>
      </section>

      {/* Fees */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-slate-700">Fees</h2>
        <div className="mt-3">
          <StudentFeesSection
            studentId={student.id}
            initialPayments={feePayments.map((p) => ({
              id: p.id,
              amountDue: Number(p.amountDue),
              amountPaid: Number(p.amountPaid),
              dueDate: p.dueDate.toISOString(),
              paidDate: p.paidDate ? p.paidDate.toISOString() : null,
              status: p.status,
            }))}
          />
        </div>
      </section>
    </main>
  );
}
