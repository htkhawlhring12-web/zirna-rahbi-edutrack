import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLinkedStudents, resolveSelectedStudent } from "@/lib/parent-access";
import { ChildSelector } from "@/components/child-selector";

export default async function ReportCardsPage({
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
        <h1 className="text-lg font-semibold text-slate-900">Report Cards</h1>
        <p className="mt-4 text-sm text-slate-500">
          No student is linked to your account yet. Please contact the centre.
        </p>
      </main>
    );
  }

  // resolveSelectedStudent already validated `selected` belongs to this
  // parent, so scoping by studentId here is safe.
  const reportCards = await db.reportCard.findMany({
    where: { studentId: selected.id },
    orderBy: { generatedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-lg font-semibold text-slate-900">Report Cards</h1>
      <p className="mt-1 text-sm text-slate-500">
        Printable report cards for {selected.fullName}.
      </p>

      <div className="mt-4">
        <ChildSelector basePath="/report-cards" linked={linked} selectedId={selected.id} />
      </div>

      <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {reportCards.map((rc) => (
          <li key={rc.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">{rc.periodLabel}</p>
              <p className="text-xs text-slate-500">
                Generated {rc.generatedAt.toLocaleDateString('en-GB')}
              </p>
            </div>
            <a
              href={`/api/report-cards/${rc.id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-slate-700 underline hover:text-slate-900"
            >
              Download
            </a>
          </li>
        ))}
        {reportCards.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-400">
            No report cards published yet.
          </li>
        )}
      </ul>
    </main>
  );
}
