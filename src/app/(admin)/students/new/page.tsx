import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CreateStudentForm } from "@/components/forms/create-student-form";

export default async function NewStudentPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-lg font-semibold text-slate-900">Add a student</h1>
      <p className="mt-1 text-sm text-slate-500">
        You can assign subjects and link a parent account after creating the
        student.
      </p>

      <div className="mt-6">
        <CreateStudentForm />
      </div>
    </main>
  );
}
