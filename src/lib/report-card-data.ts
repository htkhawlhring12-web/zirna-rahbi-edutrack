import fs from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { CLASS_LABELS } from "@/lib/constants";
import { getAtRiskConfig } from "@/lib/at-risk-config";
import type { ReportCardData } from "@/lib/pdf/report-card-document";

const CENTRE_NAME = "Zirna Rahbi Study Centre";

let cachedLogoDataUri: string | null | undefined;

async function getLogoDataUri(): Promise<string | null> {
  if (cachedLogoDataUri !== undefined) return cachedLogoDataUri;
  try {
    const filePath = path.join(process.cwd(), "public", "logo.png");
    const bytes = await fs.readFile(filePath);
    cachedLogoDataUri = `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    cachedLogoDataUri = null; // report card still generates fine without a logo
  }
  return cachedLogoDataUri;
}

export async function buildReportCardData(
  studentId: string,
  periodLabel: string,
  sinceDate?: string,
  untilDate?: string
): Promise<ReportCardData | null> {
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return null;

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (sinceDate) dateFilter.gte = new Date(sinceDate);
  if (untilDate) dateFilter.lte = new Date(untilDate);

  const markRows = await db.assessmentMark.findMany({
    where: {
      studentId,
      ...(sinceDate || untilDate
        ? { assessment: { date: dateFilter } }
        : {}),
    },
    include: { assessment: { include: { subject: true } } },
    orderBy: { assessment: { date: "asc" } },
  });

  const marks = markRows.map((m) => ({
    subjectName: m.assessment.subject.name,
    assessmentTitle: m.assessment.title,
    assessmentType: m.assessment.assessmentType,
    date: m.assessment.date,
    marksObtained: Number(m.marksObtained),
    maxMarks: Number(m.assessment.maxMarks),
  }));

  const bySubject = new Map<string, number[]>();
  for (const m of marks) {
    const arr = bySubject.get(m.subjectName) ?? [];
    arr.push((m.marksObtained / m.maxMarks) * 100);
    bySubject.set(m.subjectName, arr);
  }
  const subjectSummaries = Array.from(bySubject.entries()).map(
    ([subjectName, percentages]) => ({
      subjectName,
      average: percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
    })
  );

  // Attendance: scoped to the report period if one was given, otherwise
  // falls back to the standard rolling window (same one the dashboard and
  // parent portal use) so a report card generated without an explicit
  // range still shows something meaningful.
  const config = await getAtRiskConfig();
  const attendanceWhere = sinceDate || untilDate
    ? { studentId, date: dateFilter }
    : {
        studentId,
        date: {
          gte: new Date(Date.now() - config.attendanceWindowDays * 24 * 60 * 60 * 1000),
        },
      };
  const attendanceRecords = await db.attendanceRecord.findMany({
    where: attendanceWhere,
    select: { status: true },
  });
  const counted = attendanceRecords.filter((r) => r.status !== "EXCUSED");
  const present = counted.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  const attendanceRate = counted.length > 0 ? (present / counted.length) * 100 : null;

  return {
    centreName: CENTRE_NAME,
    studentName: student.fullName,
    classLabel: CLASS_LABELS[student.classLevel] ?? student.classLevel,
    section: student.section,
    periodLabel,
    marks,
    subjectSummaries,
    attendanceRate,
    attendanceWindowDays: config.attendanceWindowDays,
    generatedAt: new Date(),
    logoDataUri: await getLogoDataUri(),
  };
}
