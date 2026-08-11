import { NextResponse } from "next/server";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteParams = { params: Promise<{ id: string }> };

// DELETE /api/users/[id] -- admin removes a staff account (teacher,
// assistant, or another admin). Removes both the login (Supabase Auth)
// and the profile row in our own database. An admin cannot delete their
// own account this way, to avoid accidentally locking everyone out.
export async function DELETE(_request: Request, { params }: RouteParams) {
  let currentUser;
  try {
    currentUser = await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  if (id === currentUser.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const supabaseAdmin = createAdminClient();
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to delete the login account. Please try again." },
      { status: 500 }
    );
  }

  await db.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}