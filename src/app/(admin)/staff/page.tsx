import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateStaffForm } from "@/components/forms/create-staff-form";

export default async function StaffPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const staff = await db.user.findMany({
    where: { role: { in: ["ADMIN", "TEACHER", "ASSISTANT"] } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-lg font-semibold text-slate-900">Staff</h1>
      <p className="mt-1 text-sm text-slate-500">
        Create and manage teacher and assistant accounts.
      </p>

      <div className="mt-8">
        <CreateStaffForm />
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-medium text-slate-700">Current staff</h2>
        <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {staff.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {s.fullName}
                </p>
                <p className="text-xs text-slate-500">{s.email}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {s.role}
              </span>
            </li>
          ))}
          {staff.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">
              No staff accounts yet.
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}
