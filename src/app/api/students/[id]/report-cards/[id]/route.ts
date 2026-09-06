import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteParams = { params: Promise<{ id: string }> };

// DELETE /api/report-cards/[id] -- removes a report card record and its
// stored PDF. For fixing accidental duplicates.
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.reportCard.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Report card not found" }, { status: 404 });
  }

  const supabaseAdmin = createAdminClient();
  if (existing.generatedPdfUrl) {
    await supabaseAdmin.storage.from("report-cards").remove([existing.generatedPdfUrl]);
  }

  await db.reportCard.delete({ where: { id } });

  return NextResponse.json({ success: true });
}