import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/chapters/[id]/complete -- mark a chapter complete/incomplete.
// Available to admin, teacher, and assistant (not just admin), since
// teachers are the ones actually covering chapters day to day.
export async function PATCH(request: Request, { params }: RouteParams) {
  let currentUser;
  try {
    currentUser = await requireRole(["ADMIN", "TEACHER", "ASSISTANT"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: chapterId } = await params;
  const body = await request.json();
  const completed = Boolean(body.completed);

  const progress = await db.chapterProgress.upsert({
    where: { chapterId },
    create: {
      chapterId,
      completedAt: completed ? new Date() : null,
      completedBy: completed ? currentUser.id : null,
    },
    update: {
      completedAt: completed ? new Date() : null,
      completedBy: completed ? currentUser.id : null,
    },
  });

  return NextResponse.json({ progress });
}