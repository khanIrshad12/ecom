import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProductsAdminClient from "../../../components/admin/products-admin-client";

export default async function AdminProductsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  return <ProductsAdminClient />;
}

