import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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

        // Check for products in this category or any direct subcategories
        const productsCount = await prisma.product.count({
            where: {
                OR: [
                    { categoryId: id },
                    { category: { parentId: id } }
                ]
            }
        });

        if (productsCount > 0) {
            return NextResponse.json({
                error: "This category or its subcategories contain products. Please delete products first."
            }, { status: 400 });
        }

        // 1. Manually delete all subcategories first
        await prisma.category.deleteMany({
            where: { parentId: id }
        });

        // 2. Now delete the parent category
        await prisma.category.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Category and subcategories deleted" });
    } catch (error) {
        console.error("Delete category error:", error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
