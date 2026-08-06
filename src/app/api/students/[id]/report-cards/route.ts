import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateReportCardSchema } from "@/lib/validations/report-card";
import { buildReportCardData } from "@/lib/report-card-data";
import { ReportCardDocument } from "@/lib/pdf/report-card-document";
import { uploadReportCardPdf } from "@/lib/supabase/report-card-storage";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/students/[id]/report-cards -- list existing report cards for a
// student (admin only; the parent-facing list is a separate route scoped
// through parent_student_links, not this one).
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: studentId } = await params;
  const reportCards = await db.reportCard.findMany({
    where: { studentId },
    orderBy: { generatedAt: "desc" },
  });

  return NextResponse.json({ reportCards });
}

// POST /api/students/[id]/report-cards -- generate a new report card PDF,
// upload it to (private) Supabase Storage, and record it.
export async function POST(request: Request, { params }: RouteParams) {
  let currentUser;
  try {
    currentUser = await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: studentId } = await params;
  const body = await request.json();
  const parsed = generateReportCardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { periodLabel, sinceDate, untilDate } = parsed.data;

  const data = await buildReportCardData(studentId, periodLabel, sinceDate, untilDate);
  if (!data) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const pdfBuffer = await renderToBuffer(ReportCardDocument({ data }));

  const reportCard = await db.reportCard.create({
    data: {
      studentId,
      periodLabel,
      generatedPdfUrl: "", // filled in right after, once we know the id
      generatedBy: currentUser.id,
    },
  });

  const storagePath = `${studentId}/${reportCard.id}.pdf`;
  try {
    await uploadReportCardPdf(storagePath, pdfBuffer);
  } catch (err) {
    await db.reportCard.delete({ where: { id: reportCard.id } });
    console.error("Failed to upload report card PDF:", err);
    return NextResponse.json(
      { error: "Failed to save the generated PDF. Please try again." },
      { status: 500 }
    );
  }

  const updated = await db.reportCard.update({
    where: { id: reportCard.id },
    data: { generatedPdfUrl: storagePath },
  });

  return NextResponse.json({ reportCard: updated }, { status: 201 });
}
