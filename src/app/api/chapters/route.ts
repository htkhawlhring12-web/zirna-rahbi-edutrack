import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const createChapterSchema = z.object({
  unitId: z.string().min(1),
  title: z.string().min(1),
});

// GET /api/chapters?unitId=... -- list chapters (with progress) for a unit.
export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN", "TEACHER", "ASSISTANT"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const unitId = searchParams.get("unitId");

  if (!unitId) {
    return NextResponse.json({ error: "unitId is required" }, { status: 400 });
  }

  const chapters = await db.chapter.findMany({
    where: { unitId },
    include: { progress: { include: { teacher: true } } },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({ chapters });
}

// POST /api/chapters -- admin adds a new chapter under a unit.
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

  const { unitId, title } = parsed.data;

  const count = await db.chapter.count({ where: { unitId } });

  const chapter = await db.chapter.create({
    data: { unitId, title, orderIndex: count },
  });

  return NextResponse.json({ chapter }, { status: 201 });
}