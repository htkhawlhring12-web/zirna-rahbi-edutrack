import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireRole(["ADMIN", "TEACHER", "ASSISTANT"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const subjects = await db.subject.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ subjects });
}
