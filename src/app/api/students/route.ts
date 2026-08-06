import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createStudentSchema } from "@/lib/validations/student";
import { CLASS_LABELS } from "@/lib/constants";

// GET /api/students -- list all students, optionally filtered by class
// (?classLevel=CLASS_9). Staff-only (parents use the separate /my-child
// pages, which are scoped through parent_student_links rather than this
// endpoint).
export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN", "TEACHER", "ASSISTANT"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classLevel = searchParams.get("classLevel");

  if (classLevel && !(classLevel in CLASS_LABELS)) {
    return NextResponse.json({ error: "Invalid classLevel" }, { status: 400 });
  }

  const students = await db.student.findMany({
    where: {
      isActive: true,
      ...(classLevel
        ? { classLevel: classLevel as keyof typeof CLASS_LABELS }
        : {}),
    },
    orderBy: [{ classLevel: "asc" }, { fullName: "asc" }],
  });

  return NextResponse.json({ students });
}

// POST /api/students -- admin creates a new student.
export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { dateOfBirth, admissionDate, ...rest } = parsed.data;

  const student = await db.student.create({
    data: {
      ...rest,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      admissionDate: admissionDate ? new Date(admissionDate) : null,
    },
  });

  return NextResponse.json({ student }, { status: 201 });
}
