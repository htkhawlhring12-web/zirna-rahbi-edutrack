import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { z } from "zod";
import type { ClassLevel } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildReportCardData } from "@/lib/report-card-data";
import { ReportCardDocument } from "@/lib/pdf/report-card-document";
import { uploadReportCardPdf } from "@/lib/supabase/report-card-storage";

const bulkSchema = z.object({
  classLevel: z.string(),
  periodLabel: z.string().min(1),
  sinceDate: z.string().optional(),
  untilDate: z.string().optional(),
});

// POST /api/students/bulk-report-cards -- generates one report card per
// active student in a class, reusing the same PDF/storage logic as the
// single-student route. Continues past individual failures so one bad
// record doesn't block the rest of the class.
export async function POST(request: Request) {
  let currentUser;
  try {
    currentUser = await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { classLevel, periodLabel, sinceDate, untilDate } = parsed.data;

  const students = await db.student.findMany({
    where: { classLevel: classLevel as ClassLevel, isActive: true },
    orderBy: { fullName: "asc" },
  });

  const results: { studentName: string; success: boolean }[] = [];

  for (const student of students) {
    try {
      const data = await buildReportCardData(student.id, periodLabel, sinceDate, untilDate);
      if (!data) {
        results.push({ studentName: student.fullName, success: false });
        continue;
      }

      const pdfBuffer = await renderToBuffer(ReportCardDocument({ data }));

      const reportCard = await db.reportCard.create({
        data: {
          studentId: student.id,
          periodLabel,
          generatedPdfUrl: "",
          generatedBy: currentUser.id,
        },
      });

      const storagePath = `${student.id}/${reportCard.id}.pdf`;
      try {
        await uploadReportCardPdf(storagePath, pdfBuffer);
      } catch (err) {
        await db.reportCard.delete({ where: { id: reportCard.id } });
        console.error(`Failed to upload report card for ${student.fullName}:`, err);
        results.push({ studentName: student.fullName, success: false });
        continue;
      }

      await db.reportCard.update({
        where: { id: reportCard.id },
        data: { generatedPdfUrl: storagePath },
      });

      results.push({ studentName: student.fullName, success: true });
    } catch (err) {
      console.error(`Failed generating report card for ${student.fullName}:`, err);
      results.push({ studentName: student.fullName, success: false });
    }
  }

  return NextResponse.json({ results });
}