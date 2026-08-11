import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { CLASS_OPTIONS } from "@/lib/constants";

export async function GET() {
  try {
    await requireRole(["ADMIN", "TEACHER", "ASSISTANT"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const subjects = await db.subject.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ subjects });
}

const validClassValues = CLASS_OPTIONS.map((c) => c.value) as [string, ...string[]];

const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required"),
  applicableClasses: z.array(z.enum(validClassValues)).min(1, "Pick at least one class"),
});

// POST /api/subjects -- admin creates a new subject (e.g. "Mathematics"),
// specifying which class levels it applies to.
export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createSubjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const subject = await db.subject.create({
      data: {
        name: parsed.data.name,
        applicableClasses: parsed.data.applicableClasses as never,
      },
    });
    return NextResponse.json({ subject }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "A subject with this name already exists." },
      { status: 409 }
    );
  }
}