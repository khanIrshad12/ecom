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
        const existing = await prisma.category.findFirst({
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

async function updateDescendantPaths(parentId: string, parentPath: string, parentLevel: number, parentPathIds: string[]) {
    const children = await prisma.category.findMany({ where: { parentId } });
    for (const child of children) {
        const childSlug = child.slug;
        const newPath = `${parentPath}/${childSlug}`;
        const newLevel = parentLevel + 1;
        const newPathIds = [...parentPathIds, parentId];

        await prisma.category.update({
            where: { id: child.id },
            data: {
                path: newPath,
                level: newLevel,
                pathIds: newPathIds,
            },
        });

        await updateDescendantPaths(child.id, newPath, newLevel, newPathIds);
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // All category IDs to remove: this category + every descendant (pathIds contains this id)
        const descendants = await prisma.category.findMany({
            where: { pathIds: { has: id } },
            select: { id: true },
        });
        const categoryIdsToDelete = [id, ...descendants.map((c) => c.id)];

        // Check for products in this category or any descendant
        const productsCount = await prisma.product.count({
            where: { categoryId: { in: categoryIdsToDelete } },
        });

        if (productsCount > 0) {
            return NextResponse.json({
                error: "This category or its subcategories contain products. Please delete products first."
            }, { status: 400 });
        }

        // Delete all descendants and the category (order doesn't matter for MongoDB)
        await prisma.category.deleteMany({
            where: { id: { in: categoryIdsToDelete } },
        });

        return NextResponse.json({ message: "Category and subcategories deleted" });
    } catch (error) {
        console.error("Delete category error:", error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
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

        const existing = await prisma.category.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        const nextName = typeof body.name === "string" ? body.name.trim() : existing.name;
        const nextParentId =
            body.parentId === "" || body.parentId === null || body.parentId === undefined
                ? null
                : String(body.parentId);

        // Prevent self-parenting
        if (nextParentId === id) {
            return NextResponse.json({ error: "A category cannot be its own parent" }, { status: 400 });
        }

        const parent = nextParentId
            ? await prisma.category.findUnique({ where: { id: nextParentId } })
            : null;

        // Basic cycle prevention: you cannot move under your own descendant
        if (parent?.pathIds?.includes(id)) {
            return NextResponse.json({ error: "Cannot move category under its own descendant" }, { status: 400 });
        }

        // Recompute slug/path if name changed
        const baseSlug = slugify(nextName);
        const nextSlug = baseSlug && baseSlug !== existing.slug
            ? await ensureUniqueSlug(baseSlug, id)
            : existing.slug;

        const nextPath = parent?.path && parent.path !== ""
            ? `${parent.path}/${nextSlug}`
            : `/${nextSlug}`;
        const nextLevel = parent ? (parent.level ?? 0) + 1 : 0;
        const nextPathIds = parent ? [...(parent.pathIds ?? []), parent.id] : [];

        const updated = await prisma.category.update({
            where: { id },
            data: {
                name: nextName,
                slug: nextSlug,
                description: typeof body.description === "string" ? body.description : existing.description,
                imageUrl: body.imageUrl !== undefined ? (typeof body.imageUrl === "string" ? body.imageUrl : null) : existing.imageUrl,
                iconUrl: body.iconUrl !== undefined ? (typeof body.iconUrl === "string" ? body.iconUrl : null) : existing.iconUrl,
                parentId: parent?.id || null,
                displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) || 0 : existing.displayOrder,
                showInNav: body.showInNav !== undefined ? Boolean(body.showInNav) : existing.showInNav,
                isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
                metaTitle: typeof body.metaTitle === "string" ? body.metaTitle : existing.metaTitle,
                metaDescription: typeof body.metaDescription === "string" ? body.metaDescription : existing.metaDescription,

                path: nextPath,
                level: nextLevel,
                pathIds: nextPathIds,
            },
        });

        // Update descendants paths if path/level changed
        await updateDescendantPaths(id, nextPath, nextLevel, nextPathIds);

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update category error:", error);
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}
