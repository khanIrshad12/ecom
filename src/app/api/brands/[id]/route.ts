import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}

async function ensureUniqueSlug(baseSlug: string, excludeId: string) {
  let slug = baseSlug;
  let count = 1;
  while (true) {
    const existing = await prisma.brand.findFirst({
      where: { slug, NOT: { id: excludeId } },
    });
    if (!existing) break;
    slug = `${baseSlug}-${count}`;
    count++;
  }
  return slug;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brand = await prisma.brand.findUnique({
      where: { id },
    });
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
    return NextResponse.json(brand);
  } catch (error) {
    console.error("Brand GET error:", error);
    return NextResponse.json({ error: "Failed to fetch brand" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.brand.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const nextName = typeof body.name === "string" ? body.name.trim() : existing.name;
    const baseSlug = slugify(nextName);
    const nextSlug =
      nextName && nextName !== existing.name ? await ensureUniqueSlug(baseSlug, id) : existing.slug;

    const updated = await prisma.brand.update({
      where: { id },
      data: {
        name: nextName,
        slug: nextSlug,
        logoUrl: body.logoUrl !== undefined ? (typeof body.logoUrl === "string" ? body.logoUrl : null) : existing.logoUrl,
        displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : existing.displayOrder,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Brand update error:", error);
    return NextResponse.json({ error: "Failed to update brand" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Unlink products (set brandId to null)
    await prisma.product.updateMany({
      where: { brandId: id },
      data: { brandId: null },
    });

    await prisma.brand.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Brand deleted" });
  } catch (error) {
    console.error("Brand delete error:", error);
    return NextResponse.json({ error: "Failed to delete brand" }, { status: 500 });
  }
}
