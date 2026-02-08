import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SettingsAdminClient from "@/components/admin/settings-admin-client";

export default async function AdminSettingsPage() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    redirect("/");
  }

  return <SettingsAdminClient />;
}
