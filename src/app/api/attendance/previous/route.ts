import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ClassLevel } from "@prisma/client";
import { CLASS_LABELS } from "@/lib/constants";

// GET /api/attendance/previous?classLevel=&subjectId=&beforeDate=
// Finds the most recent date before `beforeDate` that has any attendance
// records for this class/subject scope, and returns that day's statuses
// per student. Powers the "Copy previous day" button -- the admin still
// reviews and clicks Save, this just pre-fills instead of starting from
// a blank grid every single day.
export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN", "TEACHER", "ASSISTANT"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classLevel = searchParams.get("classLevel");
  const subjectId = searchParams.get("subjectId"); // omitted/empty = whole-day
  const beforeDate = searchParams.get("beforeDate");

  if (!classLevel || !beforeDate) {
    return NextResponse.json(
      { error: "classLevel and beforeDate are required" },
      { status: 400 }
    );
  }
  if (!(classLevel in CLASS_LABELS)) {
    return NextResponse.json({ error: "Invalid classLevel" }, { status: 400 });
  }

  const students = await db.student.findMany({
    where: { isActive: true, classLevel: classLevel as ClassLevel },
    select: { id: true },
  });
  const studentIds = students.map((s) => s.id);

  const mostRecent = await db.attendanceRecord.findFirst({
    where: {
      studentId: { in: studentIds },
      subjectId: subjectId || null,
      date: { lt: new Date(beforeDate) },
    },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (!mostRecent) {
    return NextResponse.json({ date: null, records: [] });
  }

  const records = await db.attendanceRecord.findMany({
    where: {
      studentId: { in: studentIds },
      subjectId: subjectId || null,
      date: mostRecent.date,
    },
    select: { studentId: true, status: true },
  });

  return NextResponse.json({
    date: mostRecent.date.toISOString().slice(0, 10),
    records,
  });
}
