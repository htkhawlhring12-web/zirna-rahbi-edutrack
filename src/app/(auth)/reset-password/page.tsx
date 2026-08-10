"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// This page is where Supabase's "reset password" email link lands.
// Supabase puts the temporary login info in the URL after a "#" symbol
// (e.g. #access_token=...). This page reads that directly and uses it
// to start a session, then lets the person choose a new password.
export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function handleRecoveryLink() {
      // First, check if a session already exists (in case it was already
      // picked up automatically).
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) {
        setReady(true);
        setChecking(false);
        return;
      }

      // Otherwise, manually read the tokens Supabase put after the "#" in
      // the URL and use them to start a session ourselves.
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!sessionError) {
          setReady(true);
          setChecking(false);
          return;
        }
      }

      // No valid session and no usable tokens in the URL -- link is
      // expired or invalid.
      setChecking(false);
    }

    handleRecoveryLink();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          Set a new password
        </h1>

        {checking && (
          <p className="mt-3 text-sm text-slate-500">
            Confirming your reset link...
          </p>
        )}

        {!checking && !ready && !success && (
          <p className="mt-3 text-sm text-red-600">
            This reset link is invalid or has expired. Please ask an admin
            to send a new password reset email, and click it as soon as it
            arrives.
          </p>
        )}

        {success && (
          <p className="mt-3 text-sm text-green-600">
            Password updated! Redirecting you to sign in...
          </p>
        )}

        {ready && !success && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label
                className="mb-1 block text-xs font-medium text-slate-700"
                htmlFor="password"
              >
                New password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                required
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-medium text-slate-700"
                htmlFor="confirmPassword"
              >
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Set new password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}