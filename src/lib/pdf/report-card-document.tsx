import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  logo: { width: 40, height: 40, marginRight: 12 },
  centreName: { fontSize: 16, fontWeight: 700 },
  centreSub: { fontSize: 9, color: "#64748b", marginTop: 2 },
  title: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 16,
    marginBottom: 4,
    textAlign: "center",
  },
  periodLabel: { fontSize: 10, color: "#64748b", textAlign: "center", marginBottom: 16 },
  studentBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1 solid #e2e8f0",
    borderBottom: "1 solid #e2e8f0",
    paddingVertical: 8,
    marginBottom: 16,
  },
  studentLabel: { fontSize: 8, color: "#64748b" },
  studentValue: { fontSize: 10, fontWeight: 700, marginTop: 1 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginTop: 12, marginBottom: 6 },
  table: { display: "flex", width: "100%" },
  tableRow: { flexDirection: "row", borderBottom: "1 solid #e2e8f0" },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 4,
  },
  tableHeaderCell: { fontSize: 9, fontWeight: 700, paddingHorizontal: 4 },
  tableCell: { fontSize: 9, paddingHorizontal: 4, paddingVertical: 4 },
  colSubject: { width: "22%" },
  colTitle: { width: "34%" },
  colType: { width: "16%" },
  colMarks: { width: "14%", textAlign: "right" },
  colPercent: { width: "14%", textAlign: "right" },
  subjectAverageRow: { flexDirection: "row", backgroundColor: "#f8fafc", paddingVertical: 4 },
  attendanceBlock: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
    borderTop: "1 solid #e2e8f0",
    paddingTop: 8,
  },
});

export type ReportCardMarkRow = {
  subjectName: string;
  assessmentTitle: string;
  assessmentType: string;
  date: Date;
  marksObtained: number;
  maxMarks: number;
};

export type ReportCardSubjectSummary = {
  subjectName: string;
  average: number;
};

export type ReportCardData = {
  centreName: string;
  studentName: string;
  classLabel: string;
  section: string | null;
  periodLabel: string;
  marks: ReportCardMarkRow[];
  subjectSummaries: ReportCardSubjectSummary[];
  attendanceRate: number | null;
  attendanceWindowDays: number;
  generatedAt: Date;
  logoDataUri: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  WEEKLY_TEST: "Weekly Test",
  MONTHLY_TEST: "Monthly Test",
  EXAM: "Exam",
};

export function ReportCardDocument({ data }: { data: ReportCardData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- this is @react-pdf/renderer's Image (PDF output), not an HTML <img>; alt doesn't apply */}
          {data.logoDataUri && <Image src={data.logoDataUri} style={styles.logo} />}
          <View>
            <Text style={styles.centreName}>{data.centreName}</Text>
            <Text style={styles.centreSub}>Student Report Card</Text>
          </View>
        </View>

        <Text style={styles.title}>{data.studentName}</Text>
        <Text style={styles.periodLabel}>{data.periodLabel}</Text>

        <View style={styles.studentBlock}>
          <View>
            <Text style={styles.studentLabel}>Class</Text>
            <Text style={styles.studentValue}>
              {data.classLabel}
              {data.section ? ` · Section ${data.section}` : ""}
            </Text>
          </View>
          <View>
            <Text style={styles.studentLabel}>Attendance ({data.attendanceWindowDays} days)</Text>
            <Text style={styles.studentValue}>
              {data.attendanceRate === null ? "No data" : `${Math.round(data.attendanceRate)}%`}
            </Text>
          </View>
          <View>
            <Text style={styles.studentLabel}>Generated</Text>
            <Text style={styles.studentValue}>
              {data.generatedAt.toLocaleDateString('en-GB')}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Subject Averages</Text>
        <View style={styles.table}>
          {data.subjectSummaries.map((s) => (
            <View key={s.subjectName} style={styles.subjectAverageRow}>
              <Text style={[styles.tableCell, { width: "70%", fontWeight: 700 }]}>
                {s.subjectName}
              </Text>
              <Text style={[styles.tableCell, { width: "30%", textAlign: "right" }]}>
                {Math.round(s.average)}%
              </Text>
            </View>
          ))}
          {data.subjectSummaries.length === 0 && (
            <Text style={styles.tableCell}>No marks recorded for this period.</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>All Assessments</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colSubject]}>Subject</Text>
            <Text style={[styles.tableHeaderCell, styles.colTitle]}>Assessment</Text>
            <Text style={[styles.tableHeaderCell, styles.colType]}>Type</Text>
            <Text style={[styles.tableHeaderCell, styles.colMarks]}>Marks</Text>
            <Text style={[styles.tableHeaderCell, styles.colPercent]}>%</Text>
          </View>
          {data.marks.map((m, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colSubject]}>{m.subjectName}</Text>
              <Text style={[styles.tableCell, styles.colTitle]}>{m.assessmentTitle}</Text>
              <Text style={[styles.tableCell, styles.colType]}>
                {TYPE_LABELS[m.assessmentType] ?? m.assessmentType}
              </Text>
              <Text style={[styles.tableCell, styles.colMarks]}>
                {m.marksObtained}/{m.maxMarks}
              </Text>
              <Text style={[styles.tableCell, styles.colPercent]}>
                {Math.round((m.marksObtained / m.maxMarks) * 100)}%
              </Text>
            </View>
          ))}
          {data.marks.length === 0 && (
            <Text style={styles.tableCell}>No assessments recorded for this period.</Text>
          )}
        </View>

        <Text style={styles.footer}>
  {data.centreName} · Generated on {data.generatedAt.toLocaleDateString('en-GB')} via
  Zirna Rahbi EduTrack
</Text>
      </Page>
    </Document>
  );
}
