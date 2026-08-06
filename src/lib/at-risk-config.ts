import { db } from "@/lib/db";

// At-Risk Students detection thresholds (see docs/architecture.md §4.6).
//
// AT_RISK_CONFIG below is the DEFAULT shape, used to seed the database row
// the first time this runs, and as a fallback if that row is ever missing.
// The values an admin actually sees and edits live in the database (the
// AtRiskSettings table) and are read via getAtRiskConfig() -- see
// src/app/(admin)/settings/page.tsx and src/app/api/settings/at-risk/route.ts.
export const AT_RISK_CONFIG = {
  /** How many trailing days count toward the attendance-rate calculation. */
  attendanceWindowDays: 30,
  /** Below this attendance %, a student is flagged. */
  attendanceThresholdPercent: 75,
  /** How many of the most recent assessments (any subject) feed the average check. */
  averageRecentCount: 5,
  /** Below this average %, a student is flagged. */
  averageThresholdPercent: 40,
  /** This many ABSENT records in a row (most recent first, no gaps) triggers the flag. */
  consecutiveAbsencesThreshold: 3,
  /** Compares the average of the last N assessments per subject against the N before that. */
  trendWindowCount: 3,
  /** A drop of at least this many percentage points counts as "declining." */
  trendDeclineThresholdPoints: 10,
};

export type AtRiskConfig = typeof AT_RISK_CONFIG;

/**
 * Reads the current thresholds from the database, creating the singleton
 * row with defaults on first run if it doesn't exist yet. Callers (the
 * dashboard, the parent portal, report card generation) should use this
 * instead of importing AT_RISK_CONFIG directly, so a change an admin makes
 * on /settings takes effect everywhere immediately.
 */
export async function getAtRiskConfig(): Promise<AtRiskConfig> {
  const existing = await db.atRiskSettings.findFirst();
  if (existing) {
    return {
      attendanceWindowDays: existing.attendanceWindowDays,
      attendanceThresholdPercent: existing.attendanceThresholdPercent,
      averageRecentCount: existing.averageRecentCount,
      averageThresholdPercent: existing.averageThresholdPercent,
      consecutiveAbsencesThreshold: existing.consecutiveAbsencesThreshold,
      trendWindowCount: existing.trendWindowCount,
      trendDeclineThresholdPoints: existing.trendDeclineThresholdPoints,
    };
  }

  const created = await db.atRiskSettings.create({ data: { ...AT_RISK_CONFIG } });
  return {
    attendanceWindowDays: created.attendanceWindowDays,
    attendanceThresholdPercent: created.attendanceThresholdPercent,
    averageRecentCount: created.averageRecentCount,
    averageThresholdPercent: created.averageThresholdPercent,
    consecutiveAbsencesThreshold: created.consecutiveAbsencesThreshold,
    trendWindowCount: created.trendWindowCount,
    trendDeclineThresholdPoints: created.trendDeclineThresholdPoints,
  };
}
