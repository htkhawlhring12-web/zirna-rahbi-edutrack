import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAtRiskConfig } from "@/lib/at-risk-config";
import { AtRiskSettingsForm } from "@/components/forms/at-risk-settings-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const config = await getAtRiskConfig();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-lg font-semibold text-slate-900">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">
        Tune the At-Risk Students thresholds used on the dashboard.
      </p>

      <div className="mt-6">
        <AtRiskSettingsForm initialConfig={config} />
      </div>
    </main>
  );
}
