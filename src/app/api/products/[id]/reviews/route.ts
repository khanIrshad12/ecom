import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

const COMPLETED_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

/** Check if the user has purchased this product (has a completed order containing it). */
async function userHasPurchasedProduct(
  userId: string,
  productId: string
): Promise<boolean> {
  const orderItem = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId,
        status: { in: COMPLETED_ORDER_STATUSES },
      },
    },
    select: { id: true },
  });
  return !!orderItem;
}

/** Recompute and update Product.rating and Product.ratingCount from Review. */
async function updateProductRatingCache(productId: string): Promise<void> {
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const rating = agg._avg.rating ?? null;
  const ratingCount = agg._count.rating ?? 0;
  await prisma.product.update({
    where: { id: productId },
    data: { rating: rating ?? null, ratingCount },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Reviews GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid user session" },
        { status: 400 }
      );
    }

    const { id: productId } = await params;
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const rating = typeof body.rating === "number" ? body.rating : Number(body.rating);
    const comment =
      typeof body.comment === "string" ? body.comment.trim() || undefined : undefined;

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    const hasPurchased = await userHasPurchasedProduct(userId, productId);
    if (!hasPurchased) {
      return NextResponse.json(
        {
          error:
            "Only buyers can leave a review. You must have purchased this product.",
        },
        { status: 403 }
      );
    }

    await prisma.review.upsert({
      where: {
        productId_userId: { productId, userId },
      },
      create: {
        productId,
        userId,
        rating: Math.round(rating),
        comment,
      },
      update: {
        rating: Math.round(rating),
        comment,
      },
    });

    await updateProductRatingCache(productId);

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Reviews POST Error:", error);
    return NextResponse.json(
      { error: "Failed to create or update review" },
      { status: 500 }
    );
  }
}
