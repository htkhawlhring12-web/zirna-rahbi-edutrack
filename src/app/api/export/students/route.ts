import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { CLASS_LABELS } from "@/lib/constants";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return new Response("Unauthorized", { status: 403 });
  }

  const students = await db.student.findMany({
    orderBy: [{ classLevel: "asc" }, { fullName: "asc" }],
  });

  const rows = students.map((s) => ({
    fullName: s.fullName,
    classLevel: CLASS_LABELS[s.classLevel] ?? s.classLevel,
    section: s.section ?? "",
    dateOfBirth: s.dateOfBirth ? s.dateOfBirth.toISOString().slice(0, 10) : "",
    admissionDate: s.admissionDate ? s.admissionDate.toISOString().slice(0, 10) : "",
    schoolName: s.schoolName ?? "",
    contactPhone: s.contactPhone ?? "",
    address: s.address ?? "",
    isActive: s.isActive ? "Active" : "Inactive",
  }));

  const csv = toCsv(rows, [
    { key: "fullName", label: "Name" },
    { key: "classLevel", label: "Class" },
    { key: "section", label: "Section" },
    { key: "dateOfBirth", label: "Date of Birth" },
    { key: "admissionDate", label: "Admission Date" },
    { key: "schoolName", label: "School" },
    { key: "contactPhone", label: "Contact Phone" },
    { key: "address", label: "Address" },
    { key: "isActive", label: "Status" },
  ]);

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `students-${date}.csv`);
}
