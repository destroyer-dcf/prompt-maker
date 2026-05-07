import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";

export async function AdminGuard({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch {
    redirect("/prompts");
  }

  return <>{children}</>;
}
