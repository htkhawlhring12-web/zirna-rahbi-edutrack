import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  if (!user) {
    redirect("/login");
  }

  switch (user.role) {
    case "ADMIN":
      redirect("/dashboard"); // Points straight to your dashboard folder
    case "TEACHER":
    case "ASSISTANT":
      redirect("/teacher");
    case "PARENT":
      redirect("/parents");
    default:
      redirect("/login");
  }
}