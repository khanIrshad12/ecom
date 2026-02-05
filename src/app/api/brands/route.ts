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

async function ensureUniqueSlug(baseSlug: string, excludeId?: string) {
  let slug = baseSlug;
  let count = 1;
  while (true) {
    const existing = await prisma.brand.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (!existing) break;
    slug = `${baseSlug}-${count}`;
    count++;
  }
  return slug;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") === "1" || searchParams.get("activeOnly") === "true";
    const brands = await prisma.brand.findMany({
      ...(activeOnly ? { where: { isActive: true } } : {}),
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(brands);
  } catch (error) {
    console.error("Brands GET error:", error);
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, logoUrl, displayOrder = 0, isActive = true } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }

    const baseSlug = slugify(name);
    const slug = await ensureUniqueSlug(baseSlug);

    const brand = await prisma.brand.create({
      data: {
        name: name.trim(),
        slug,
        logoUrl: typeof logoUrl === "string" ? logoUrl : null,
        displayOrder: Number(displayOrder) || 0,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json(brand);
  } catch (error) {
    console.error("Brand creation error:", error);
    return NextResponse.json({ error: "Could not create brand" }, { status: 400 });
  }
}
