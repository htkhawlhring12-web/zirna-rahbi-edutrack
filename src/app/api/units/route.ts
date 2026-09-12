import { NextResponse } from "next/server";
import { z } from "zod";
import type { ClassLevel } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const createUnitSchema = z.object({
  subjectId: z.string().min(1),
  classLevel: z.string().min(1),
  title: z.string().min(1),
});

// GET /api/units?subjectId=...&classLevel=... -- list units (with their
// chapters and progress) for a subject + class.
export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN", "TEACHER", "ASSISTANT"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");
  const classLevel = searchParams.get("classLevel");

  if (!subjectId || !classLevel) {
    return NextResponse.json(
      { error: "subjectId and classLevel are required" },
      { status: 400 }
    );
  }

  const units = await db.unit.findMany({
    where: { subjectId, classLevel: classLevel as ClassLevel },
    include: {
      chapters: {
        include: { progress: { include: { teacher: true } } },
        orderBy: { orderIndex: "asc" },
      },
    },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({ units });
}

// POST /api/units -- admin adds a new unit for a subject + class.
export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createUnitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { subjectId, classLevel, title } = parsed.data;

  const count = await db.unit.count({
    where: { subjectId, classLevel: classLevel as ClassLevel },
  });

  const unit = await db.unit.create({
    data: { subjectId, classLevel: classLevel as ClassLevel, title, orderIndex: count },
  });

  return NextResponse.json({ unit }, { status: 201 });
}