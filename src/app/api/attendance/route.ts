import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ClassLevel } from "@prisma/client";
import { submitAttendanceSchema } from "@/lib/validations/attendance";
import { CLASS_LABELS } from "@/lib/constants";

// GET /api/attendance?date=2026-08-02&classLevel=CLASS_9&subjectId=...
// Returns every active student in that class alongside their existing
// attendance status for that date/subject (null if not yet marked). This
// merged shape is what the marking UI renders directly, one row per
// student, without a second round trip.
export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN", "TEACHER", "ASSISTANT"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const classLevel = searchParams.get("classLevel");
  const subjectId = searchParams.get("subjectId"); // omitted/empty = whole-day

  if (!date || !classLevel) {
    return NextResponse.json(
      { error: "date and classLevel are required" },
      { status: 400 }
    );
  }
  if (!(classLevel in CLASS_LABELS)) {
    return NextResponse.json({ error: "Invalid classLevel" }, { status: 400 });
  }

  const students = await db.student.findMany({
    where: { isActive: true, classLevel: classLevel as ClassLevel },
    orderBy: { fullName: "asc" },
  });

  const existing = await db.attendanceRecord.findMany({
    where: {
      date: new Date(date),
      subjectId: subjectId || null,
      studentId: { in: students.map((s) => s.id) },
    },
  });
  const byStudent = new Map(existing.map((r) => [r.studentId, r.status] as const));

  return NextResponse.json({
    students: students.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      status: byStudent.get(s.id) ?? null,
    })),
  });
}

// POST /api/attendance -- bulk create/update attendance for one date +
// subject (or whole-day if subjectId is omitted). Each staff member can
// only ever write records with marked_by = themselves (enforced by both
// this handler and the RLS policy, for anyone accessing Supabase
// directly) -- this keeps the audit trail (marked_by) meaningful even
// when re-editing an earlier entry.
export async function POST(request: Request) {
  let currentUser;
  try {
    currentUser = await requireRole(["ADMIN", "TEACHER", "ASSISTANT"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = submitAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { date, subjectId, records } = parsed.data;
  const dateValue = new Date(date);

  await db.$transaction(
    records.map((r) =>
      db.attendanceRecord.upsert({
        where: {
          studentId_date_subjectId: {
            studentId: r.studentId,
            date: dateValue,
            subjectId: subjectId ?? "",
          },
        },
        update: { status: r.status, markedBy: currentUser.id },
        create: {
          studentId: r.studentId,
          date: dateValue,
          subjectId: subjectId ?? null,
          status: r.status,
          markedBy: currentUser.id,
        },
      })
    )
  );

  return NextResponse.json({ success: true, count: records.length });
}
