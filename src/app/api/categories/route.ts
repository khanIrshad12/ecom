import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            include: { subCategories: true },
        });
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name, parentId, imageUrl } = await req.json();

        let baseSlug = name.toLowerCase().trim().replace(/ /g, "-").replace(/[^\w-]+/g, "");

        if (parentId) {
            const parent = await prisma.category.findUnique({
                where: { id: parentId }
            });
            if (parent) {
                baseSlug = `${parent.slug}-${baseSlug}`;
            }
        }

        let slug = baseSlug;
        let count = 1;

        // Recursive check for slug collision
        while (true) {
            const existing = await prisma.category.findUnique({
                where: { slug }
            });
            if (!existing) break;
            slug = `${baseSlug}-${count}`;
            count++;
        }

        const category = await prisma.category.create({
            data: {
                name,
                slug,
                parentId: parentId || null,
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Category creation error:", error);
        return NextResponse.json({ error: "Could not create category. It might already exist." }, { status: 400 });
    }
}
