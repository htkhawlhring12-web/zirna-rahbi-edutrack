import { AT_RISK_CONFIG } from "@/lib/at-risk-config";

export type AttendanceInput = { date: Date; status: string };
export type MarkInput = {
  subjectId: string;
  subjectName: string;
  date: Date;
  marksObtained: number;
  maxMarks: number;
};

export type AtRiskFlag = {
  type: "LOW_ATTENDANCE" | "LOW_AVERAGE" | "CONSECUTIVE_ABSENCES" | "DECLINING_TREND";
  label: string;
  detail: string;
};

export type AtRiskStudent = {
  studentId: string;
  fullName: string;
  classLevel: string;
  flags: AtRiskFlag[];
};

function average(marks: MarkInput[]): number {
  return (
    marks.reduce((sum, m) => sum + (m.marksObtained / m.maxMarks) * 100, 0) /
    marks.length
  );
}

/**
 * Raw attendance rate over a trailing window. Exported separately from
 * checkLowAttendance so other features (e.g. the parent portal's
 * attendance summary) can reuse the same calculation without duplicating
 * the EXCUSED-exclusion logic.
 */
export function computeAttendanceRate(
  records: AttendanceInput[],
  windowDays: number
): { rate: number; present: number; total: number } | null {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const windowRecords = records.filter((r) => r.date.getTime() >= cutoff);
  const counted = windowRecords.filter((r) => r.status !== "EXCUSED");
  if (counted.length === 0) return null;

  const present = counted.filter(
    (r) => r.status === "PRESENT" || r.status === "LATE"
  ).length;
  return { rate: (present / counted.length) * 100, present, total: counted.length };
}

function checkLowAttendance(
  records: AttendanceInput[],
  config: typeof AT_RISK_CONFIG
): AtRiskFlag | null {
  const result = computeAttendanceRate(records, config.attendanceWindowDays);
  if (!result || result.rate >= config.attendanceThresholdPercent) return null;
  return {
    type: "LOW_ATTENDANCE",
    label: "Low attendance",
    detail: `${Math.round(result.rate)}% over the last ${config.attendanceWindowDays} days`,
  };
}

function checkConsecutiveAbsences(
  records: AttendanceInput[],
  config: typeof AT_RISK_CONFIG
): AtRiskFlag | null {
  const sorted = [...records].sort((a, b) => b.date.getTime() - a.date.getTime());
  let streak = 0;
  for (const r of sorted) {
    if (r.status === "ABSENT") streak++;
    else break;
  }
  if (streak < config.consecutiveAbsencesThreshold) return null;
  return {
    type: "CONSECUTIVE_ABSENCES",
    label: "Consecutive absences",
    detail: `${streak} in a row`,
  };
}

function checkLowAverage(
  marks: MarkInput[],
  config: typeof AT_RISK_CONFIG
): AtRiskFlag | null {
  const sorted = [...marks].sort((a, b) => b.date.getTime() - a.date.getTime());
  const recent = sorted.slice(0, config.averageRecentCount);
  if (recent.length === 0) return null;

  const avgPercent = average(recent);
  if (avgPercent >= config.averageThresholdPercent) return null;
  return {
    type: "LOW_AVERAGE",
    label: "Low average",
    detail: `${Math.round(avgPercent)}% across the last ${recent.length} assessment${
      recent.length === 1 ? "" : "s"
    }`,
  };
}

function checkDecliningTrend(
  marks: MarkInput[],
  config: typeof AT_RISK_CONFIG
): AtRiskFlag[] {
  const bySubject = new Map<string, MarkInput[]>();
  for (const m of marks) {
    const arr = bySubject.get(m.subjectId) ?? [];
    arr.push(m);
    bySubject.set(m.subjectId, arr);
  }

  const flags: AtRiskFlag[] = [];
  const n = config.trendWindowCount;

  for (const subjectMarks of bySubject.values()) {
    const sorted = [...subjectMarks].sort((a, b) => a.date.getTime() - b.date.getTime());
    if (sorted.length < n * 2) continue; // not enough history to compare yet

    const recent = sorted.slice(-n);
    const previous = sorted.slice(-2 * n, -n);
    const recentAvg = average(recent);
    const previousAvg = average(previous);
    const drop = previousAvg - recentAvg;

    if (drop >= config.trendDeclineThresholdPoints) {
      flags.push({
        type: "DECLINING_TREND",
        label: "Declining trend",
        detail: `${recent[0].subjectName}: ${Math.round(previousAvg)}% → ${Math.round(recentAvg)}%`,
      });
    }
  }

  return flags;
}

/**
 * Computes the At-Risk list from pre-fetched data (see docs/architecture.md
 * §4.6). Deliberately takes plain data in and plain data out -- no Prisma
 * calls here -- so this logic is easy to reason about and to unit test
 * later without spinning up a database.
 */
export function computeAtRiskStudents(
  students: { id: string; fullName: string; classLevel: string }[],
  attendanceByStudent: Map<string, AttendanceInput[]>,
  marksByStudent: Map<string, MarkInput[]>,
  config: typeof AT_RISK_CONFIG = AT_RISK_CONFIG
): AtRiskStudent[] {
  const results: AtRiskStudent[] = [];

  for (const student of students) {
    const records = attendanceByStudent.get(student.id) ?? [];
    const marks = marksByStudent.get(student.id) ?? [];

    const flags: AtRiskFlag[] = [];
    const lowAttendance = checkLowAttendance(records, config);
    if (lowAttendance) flags.push(lowAttendance);
    const consecutiveAbsences = checkConsecutiveAbsences(records, config);
    if (consecutiveAbsences) flags.push(consecutiveAbsences);
    const lowAverage = checkLowAverage(marks, config);
    if (lowAverage) flags.push(lowAverage);
    flags.push(...checkDecliningTrend(marks, config));

    if (flags.length > 0) {
      results.push({
        studentId: student.id,
        fullName: student.fullName,
        classLevel: student.classLevel,
        flags,
      });
    }
  }

  // Severity ordering: more flags first (a student hitting multiple
  // criteria -- e.g. low attendance AND a declining trend -- is usually
  // the more urgent case to look at first).
  return results.sort((a, b) => b.flags.length - a.flags.length);
}
