import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { cartProductIds = [], limit = 8 } = body;

        // If cart is empty, return random products
        if (!cartProductIds || cartProductIds.length === 0) {
            const randomProducts = await prisma.product.findMany({
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    images: { take: 1 },
                    variants: { take: 1 },
                    category: { select: { name: true } },
                },
            });
            return NextResponse.json(randomProducts);
        }

        // Get cart products to find their categories
        const cartProducts = await prisma.product.findMany({
            where: { id: { in: cartProductIds } },
            select: { id: true, categoryId: true },
        });

        const cartCategoryIds = [...new Set(cartProducts.map((p) => p.categoryId))];
        const similarCount = Math.ceil(limit * 0.6); // 60% similar
        const randomCount = limit - similarCount;

        // Fetch similar products (same categories, exclude cart items)
        const similarProducts = await prisma.product.findMany({
            where: {
                categoryId: { in: cartCategoryIds },
                id: { notIn: cartProductIds },
            },
            take: similarCount,
            include: {
                images: { take: 1 },
                variants: { take: 1 },
                category: { select: { name: true } },
            },
        });

        const similarProductIds = similarProducts.map((p) => p.id);
        const excludeIds = [...cartProductIds, ...similarProductIds];

        // Fill remaining slots with random products using aggregation (efficient for MongoDB)
        let randomProducts: any[] = [];
        if (similarProducts.length < limit) {
            const neededCount = limit - similarProducts.length;
            
            // Use MongoDB aggregation for efficient random sampling
            try {
                const randomResult = await prisma.product.aggregateRaw({
                    pipeline: [
                        {
                            $match: {
                                _id: { $nin: excludeIds.map(id => ({ $oid: id })) },
                            },
                        },
                        { $sample: { size: neededCount } },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                slug: 1,
                                description: 1,
                                categoryId: 1,
                            },
                        },
                    ],
                });

                // Fetch full product details for sampled products
                const randomIds = (randomResult as any[]).map((p: any) => p._id.$oid);
                if (randomIds.length > 0) {
                    randomProducts = await prisma.product.findMany({
                        where: { id: { in: randomIds } },
                        include: {
                            images: { take: 1 },
                            variants: { take: 1 },
                            category: { select: { name: true } },
                        },
                    });
                }
            } catch (error) {
                // Fallback to simple random if aggregation fails
                console.warn("MongoDB aggregation failed, using fallback:", error);
                randomProducts = await prisma.product.findMany({
                    where: { id: { notIn: excludeIds } },
                    take: neededCount,
                    orderBy: { createdAt: "desc" },
                    include: {
                        images: { take: 1 },
                        variants: { take: 1 },
                        category: { select: { name: true } },
                    },
                });
            }
        }

        // Combine and return
        const recommendations = [...similarProducts, ...randomProducts].slice(0, limit);
        return NextResponse.json(recommendations);
    } catch (error) {
        console.error("Recommendations error:", error);
        return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
    }
}
