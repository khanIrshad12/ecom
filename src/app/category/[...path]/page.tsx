import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function CategoryCatchAllPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const pathSegments = path || [];
  const categoryPath = `/${pathSegments.join("/")}`;
  const slugFromPath = pathSegments[pathSegments.length - 1]?.toLowerCase();

  // Resolve category by path or slug, then redirect to ID-based URL
  const byPath = await prisma.category.findFirst({
    where: { path: categoryPath, isActive: true },
    select: { id: true },
  });
  const bySlug = !byPath && slugFromPath
    ? await prisma.category.findFirst({
        where: { slug: slugFromPath, isActive: true },
        select: { id: true },
      })
    : null;
  const category = byPath ?? bySlug;
  if (category) {
    redirect(`/products?categoryId=${encodeURIComponent(category.id)}`);
  }
  // Fallback: old path param (e.g. bookmarks)
  redirect(`/products?path=${encodeURIComponent(categoryPath)}`);
}

