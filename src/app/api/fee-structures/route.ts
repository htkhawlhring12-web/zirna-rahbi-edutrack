import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createFeeStructureSchema } from "@/lib/validations/fee";

// GET /api/fee-structures -- list all fee structures, most recent first.
export async function GET() {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const feeStructures = await db.feeStructure.findMany({
    orderBy: [{ classLevel: "asc" }, { effectiveFrom: "desc" }],
  });

  return NextResponse.json({ feeStructures });
}

// POST /api/fee-structures -- admin sets the fee amount/cycle for a class.
// Creating a new one for a class doesn't delete the old one (it stays as
// history of what fees used to be); the UI shows the most recent as
// current.
export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createFeeStructureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { classLevel, amount, billingCycle, effectiveFrom } = parsed.data;

  const feeStructure = await db.feeStructure.create({
    data: {
      classLevel,
      amount,
      billingCycle,
      effectiveFrom: new Date(effectiveFrom),
    },
  });

  return NextResponse.json({ feeStructure }, { status: 201 });
}
