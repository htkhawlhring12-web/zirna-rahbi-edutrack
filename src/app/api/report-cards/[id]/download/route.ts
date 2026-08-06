import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getReportCardSignedUrl } from "@/lib/supabase/report-card-storage";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/report-cards/[id]/download -- redirects to a signed URL that
// expires in an hour. This is the single access-control checkpoint for
// every report card download, regardless of whether the request came from
// the admin's student page or a parent's report-cards list: admins can
// download any report card, parents only one linked to them.
export async function GET(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reportCard = await db.reportCard.findUnique({ where: { id } });
  if (!reportCard) {
    return NextResponse.json({ error: "Report card not found" }, { status: 404 });
  }

  if (user.role !== "ADMIN") {
    if (user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const link = await db.parentStudentLink.findFirst({
      where: { parentUserId: user.id, studentId: reportCard.studentId },
    });
    if (!link) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  try {
    const signedUrl = await getReportCardSignedUrl(reportCard.generatedPdfUrl);
    return NextResponse.redirect(signedUrl);
  } catch (err) {
    console.error("Failed to sign report card URL:", err);
    return NextResponse.json(
      { error: "Could not generate a download link. Please try again." },
      { status: 500 }
    );
  }
}
