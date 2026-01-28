import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CategoriesAdminClient from "@/components/admin/categories-admin-client";

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  return <CategoriesAdminClient />;
}

