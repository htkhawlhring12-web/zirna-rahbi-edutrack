import Image from "next/image";
import Link from "next/link";
import type { CurrentUser } from "@/lib/auth";
import { HeaderNav } from "@/components/header-nav";
import { SignOutButton } from "@/components/sign-out-button";

const NAV_BY_ROLE: Record<string, { href: string; label: string }[]> = {
  ADMIN: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/students", label: "Students" },
    { href: "/staff", label: "Staff" },
    { href: "/attendance", label: "Attendance" },
    { href: "/marks-entry", label: "Marks Entry" },
    { href: "/fees", label: "Fees" },
    { href: "/export", label: "Export" },
    { href: "/settings", label: "Settings" },
  ],
  TEACHER: [
    { href: "/my-students", label: "My Students" },
    { href: "/attendance", label: "Attendance" },
    { href: "/marks-entry", label: "Marks Entry" },
  ],
  ASSISTANT: [
  { href: "/students", label: "Students" },
  { href: "/my-students", label: "My Students" },
  { href: "/attendance", label: "Attendance" },
],
  PARENT: [
    { href: "/my-child", label: "My Child" },
    { href: "/progress", label: "Progress" },
    { href: "/report-cards", label: "Report Cards" },
  ],
};

export function SiteHeader({ user }: { user: CurrentUser | null }) {
  const homeHref = user ? "/" : "/login";
  const navItems = user ? NAV_BY_ROLE[user.role] ?? [] : [];

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <Link href={homeHref} className="flex items-center gap-2 shrink-0">
          <Image src="/logo.png" alt="Zirna Rahbi Study Centre" width={32} height={32} />
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            Zirna Rahbi EduTrack
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-4 overflow-x-auto">
            <HeaderNav items={navItems} />
            <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">
              {user.fullName}
            </span>
            <SignOutButton />
          </div>
        )}
      </div>
    </header>
  );
}
