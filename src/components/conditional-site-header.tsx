"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import type { CurrentUser } from "@/lib/auth";

export function ConditionalSiteHeader({ user }: { user: CurrentUser | null }) {
  const pathname = usePathname();

  // Hide the header completely on the login page
  if (pathname === "/login") {
    return null;
  }

  return <SiteHeader user={user} />;
}