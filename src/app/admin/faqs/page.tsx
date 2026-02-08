import { auth } from "@/auth";
import { redirect } from "next/navigation";
import FaqsAdminClient from "@/components/admin/faqs-admin-client";

export default async function AdminFaqsPage() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    redirect("/");
  }

  return <FaqsAdminClient />;
}
