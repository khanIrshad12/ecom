import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: {
                category: true,
                brand: true,
                images: { orderBy: { displayOrder: "asc" } },
                variants: true,
            },
        });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const {
            name,
            description,
            categoryId,
            brandId,
            isTrending = false,
            variants, // Array of {color, size, stock, price}
            images, // Array of {driveUrl, color?, displayOrder?}
        } = await req.json();

        let slug = name.toLowerCase().trim().replace(/ /g, "-").replace(/[^\w-]+/g, "");

        // Check for slug collision
        let existingProduct = await prisma.product.findUnique({ where: { slug } });
        if (existingProduct) {
            slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
        }

        const product = await prisma.product.create({
            data: {
                name,
                slug,
                description,
                categoryId,
                brandId: brandId || null,
                isTrending: Boolean(isTrending),
                variants: {
                    create: variants.map((v: any) => ({
                        color: v.color,
                        size: v.size,
                        stock: parseInt(v.stock),
                        price: Math.round(Number(v.price)),
                        actualPrice: v.actualPrice != null && Number(v.actualPrice) > 0 ? Math.round(Number(v.actualPrice)) : null,
                    })),
                },
                images: {
                    create: images.map((img: { driveUrl: string; color?: string; displayOrder?: number }, idx: number) => ({
                        driveUrl: img.driveUrl,
                        color: img.color || null,
                        displayOrder: img.displayOrder ?? idx,
                    })),
                },
            },
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error("Product creation error:", error);
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}
