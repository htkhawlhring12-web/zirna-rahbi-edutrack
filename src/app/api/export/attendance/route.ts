import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ClassLevel } from "@prisma/client";
import { toCsv, csvResponse } from "@/lib/csv";
import { CLASS_LABELS } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return new Response("Unauthorized", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classLevel = searchParams.get("classLevel");
  const sinceDate = searchParams.get("sinceDate");
  const untilDate = searchParams.get("untilDate");

  if (classLevel && !(classLevel in CLASS_LABELS)) {
    return new Response("Invalid classLevel", { status: 400 });
  }

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (sinceDate) dateFilter.gte = new Date(sinceDate);
  if (untilDate) dateFilter.lte = new Date(untilDate);

  const records = await db.attendanceRecord.findMany({
    where: {
      ...(sinceDate || untilDate ? { date: dateFilter } : {}),
      student: classLevel
        ? { classLevel: classLevel as ClassLevel }
        : undefined,
    },
    include: { student: true, subject: true, markedByUser: true },
    orderBy: [{ date: "desc" }, { student: { fullName: "asc" } }],
  });

  const rows = records.map((r) => ({
    studentName: r.student.fullName,
    classLevel: CLASS_LABELS[r.student.classLevel] ?? r.student.classLevel,
    date: r.date.toISOString().slice(0, 10),
    subject: r.subject ? r.subject.name : "Whole day",
    status: r.status,
    markedBy: r.markedByUser.fullName,
  }));

  const csv = toCsv(rows, [
    { key: "studentName", label: "Student" },
    { key: "classLevel", label: "Class" },
    { key: "date", label: "Date" },
    { key: "subject", label: "Subject" },
    { key: "status", label: "Status" },
    { key: "markedBy", label: "Marked By" },
  ]);

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `attendance-${date}.csv`);
}
