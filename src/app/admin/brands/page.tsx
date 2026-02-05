import { auth } from "@/auth";
import { redirect } from "next/navigation";
import BrandsAdminClient from "@/components/admin/brands-admin-client";

export default async function AdminBrandsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  return <BrandsAdminClient />;
}
