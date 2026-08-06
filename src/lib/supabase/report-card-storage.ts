import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "report-cards";

// Report cards contain a minor's grades and attendance -- this bucket is
// PRIVATE. We never generate a permanent public URL; every download goes
// through src/app/api/report-cards/[id]/download/route.ts, which checks
// the requester is either the admin or a parent actually linked to that
// student, and only then mints a short-lived signed URL.
async function ensureBucketExists() {
  const supabaseAdmin = createAdminClient();
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    await supabaseAdmin.storage.createBucket(BUCKET, { public: false });
  }
}

export async function uploadReportCardPdf(
  path: string,
  pdfBytes: Uint8Array
): Promise<void> {
  await ensureBucketExists();
  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });
  if (error) throw error;
}

export async function getReportCardSignedUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) throw error ?? new Error("Failed to sign URL");
  return data.signedUrl;
}
