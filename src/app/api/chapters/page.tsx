import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ManageChaptersForm } from "@/components/forms/manage-chapters-form";

export default async function ChaptersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const subjects = await db.subject.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-lg font-semibold text-slate-900">Chapters & Syllabus</h1>
      <p className="mt-1 text-sm text-slate-500">
        Add chapters per subject and class, and track how much of the syllabus is covered.
      </p>
      <div className="mt-6">
        <ManageChaptersForm subjects={subjects} />
      </div>
    </main>
  );
}