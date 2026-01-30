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

        // Delete related records first (schema uses onDelete: NoAction)
        await prisma.cartItem.deleteMany({
            where: { productId: id },
        });
        await prisma.wishlist.deleteMany({
            where: { productId: id },
        });
        await prisma.productVariant.deleteMany({
            where: { productId: id },
        });
        await prisma.productImage.deleteMany({
            where: { productId: id },
        });
        await prisma.product.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Product deleted" });
    } catch (error) {
        console.error("Delete product error:", error);
        return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
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
        const { name, description, categoryId, images, variants } = body;

        // Auto-generate slug from name
        let slug = name.toLowerCase().trim().replace(/ /g, "-").replace(/[^\w-]+/g, "");

        // Check for slug collision (excluding current product)
        let existingProduct = await prisma.product.findFirst({
            where: {
                slug,
                NOT: { id: id }
            }
        });
        if (existingProduct) {
            slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
        }

        const updatedProduct = await prisma.$transaction(async (tx: any) => {
            // 1. Delete existing variants and images
            await tx.productVariant.deleteMany({ where: { productId: id } });
            await tx.productImage.deleteMany({ where: { productId: id } });

            // 2. Update the product
            return await tx.product.update({
                where: { id },
                data: {
                    name,
                    slug,
                    description,
                    categoryId,
                    images: {
                        create: images.map((img: { driveUrl: string, color?: string }) => ({
                            driveUrl: img.driveUrl,
                            color: img.color || null,
                        })),
                    },
                    variants: {
                        create: variants.map((v: any) => ({
                            color: v.color,
                            size: v.size,
                            stock: parseInt(v.stock),
                            price: parseFloat(v.price),
                            actualPrice: v.actualPrice != null && Number(v.actualPrice) > 0 ? parseFloat(v.actualPrice) : null,
                        })),
                    },
                },
                include: { images: true, variants: true },
            });
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error("Update product error:", error);
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}
