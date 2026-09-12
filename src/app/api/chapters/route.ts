import { NextResponse } from "next/server";
import { z } from "zod";
import type { ClassLevel } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const createChapterSchema = z.object({
  subjectId: z.string().min(1),
  classLevel: z.string().min(1),
  title: z.string().min(1),
});

// GET /api/chapters?subjectId=...&classLevel=... -- list chapters (with
// their progress, if any) for a given subject + class.
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

  const chapters = await db.chapter.findMany({
    where: { subjectId, classLevel: classLevel as ClassLevel },
    include: { progress: { include: { teacher: true } } },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({ chapters });
}

// POST /api/chapters -- admin adds a new chapter for a subject + class.
export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createChapterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { subjectId, classLevel, title } = parsed.data;

  const count = await db.chapter.count({
    where: { subjectId, classLevel: classLevel as ClassLevel },
  });

  const chapter = await db.chapter.create({
    data: {
      subjectId,
      classLevel: classLevel as ClassLevel,
      title,
      orderIndex: count,
    },
  });

  return NextResponse.json({ chapter }, { status: 201 });
}