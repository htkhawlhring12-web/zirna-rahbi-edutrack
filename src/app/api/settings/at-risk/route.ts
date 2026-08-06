import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAtRiskConfig } from "@/lib/at-risk-config";
import { updateAtRiskSettingsSchema } from "@/lib/validations/settings";

// GET /api/settings/at-risk -- current thresholds (creates the row with
// defaults on first call if it doesn't exist yet).
export async function GET() {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const config = await getAtRiskConfig();
  return NextResponse.json({ config });
}

// PATCH /api/settings/at-risk -- update the thresholds. Singleton table:
// updates the existing row if one exists (it always will by the time this
// is called, since GET/getAtRiskConfig() creates it on first read), or
// creates it if this is somehow the very first settings write.
export async function PATCH(request: Request) {
  let currentUser;
  try {
    currentUser = await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateAtRiskSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await db.atRiskSettings.findFirst();
  const settings = existing
    ? await db.atRiskSettings.update({
        where: { id: existing.id },
        data: { ...parsed.data, updatedBy: currentUser.id },
      })
    : await db.atRiskSettings.create({
        data: { ...parsed.data, updatedBy: currentUser.id },
      });

  return NextResponse.json({ config: settings });
}
