import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function slugify(input: string) {
    return input
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "");
}

async function ensureUniqueSlug(baseSlug: string) {
    let slug = baseSlug;
    let count = 1;
    // Recursive check for slug collision
    while (true) {
        const existing = await prisma.category.findUnique({ where: { slug } });
        if (!existing) break;
        slug = `${baseSlug}-${count}`;
        count++;
    }
    return slug;
}

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: [{ level: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
        });

        // Build a stable tree (supports N-depth)
        const byId = new Map<string, any>();
        categories.forEach((c: any) => byId.set(c.id, { ...c, children: [] }));

        const roots: any[] = [];
        byId.forEach((node) => {
            if (node.parentId && byId.has(node.parentId)) {
                byId.get(node.parentId).children.push(node);
            } else {
                roots.push(node);
            }
        });

        return NextResponse.json({ flat: categories, tree: roots });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            name,
            parentId,
            imageUrl,
            iconUrl,
            description,
            displayOrder = 0,
            showInNav = true,
            isActive = true,
            metaTitle,
            metaDescription,
        } = body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return NextResponse.json({ error: "Category name is required" }, { status: 400 });
        }

        const parent = parentId
            ? await prisma.category.findUnique({ where: { id: parentId } })
            : null;

        const baseSlug = slugify(name);
        const uniqueSlug = await ensureUniqueSlug(baseSlug);

        const path = parent?.path && parent.path !== ""
            ? `${parent.path}/${uniqueSlug}`
            : `/${uniqueSlug}`;
        const level = parent ? (parent.level ?? 0) + 1 : 0;
        const pathIds = parent ? [...(parent.pathIds ?? []), parent.id] : [];

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                slug: uniqueSlug,
                description: typeof description === "string" ? description : null,
                imageUrl: typeof imageUrl === "string" ? imageUrl : null,
                iconUrl: typeof iconUrl === "string" ? iconUrl : null,
                parentId: parent?.id || null,

                path,
                level,
                pathIds,

                displayOrder: Number(displayOrder) || 0,
                showInNav: Boolean(showInNav),
                isActive: Boolean(isActive),

                metaTitle: typeof metaTitle === "string" ? metaTitle : null,
                metaDescription: typeof metaDescription === "string" ? metaDescription : null,
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Category creation error:", error);
        return NextResponse.json({ error: "Could not create category. It might already exist." }, { status: 400 });
    }
}
