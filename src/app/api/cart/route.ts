import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                images: true,
                                category: true,
                            }
                        },
                        variant: true,
                    }
                }
            }
        });

        return NextResponse.json(cart || { items: [] });
    } catch (error: any) {
        console.error("Cart GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { productId, variantId, quantity = 1 } = await req.json();

        if (!productId || !variantId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get or create cart
        let cart = await prisma.cart.findUnique({
            where: { userId }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId }
            });
        }

        // Check if item already in cart
        const existingItem = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId,
                variantId,
            }
        });

        if (existingItem) {
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity }
            });
        } else {
            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    variantId,
                    quantity
                }
            });
        }

        return NextResponse.json({ message: "Item added to cart" });
    } catch (error: any) {
        console.error("Cart POST Error:", error);
        return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { itemId, quantity } = await req.json();

        if (quantity < 1) {
            await prisma.cartItem.delete({
                where: { id: itemId }
            });
            return NextResponse.json({ message: "Item removed from cart" });
        }

        await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity }
        });

        return NextResponse.json({ message: "Quantity updated" });
    } catch (error: any) {
        console.error("Cart PATCH Error:", error);
        return NextResponse.json({ error: "Failed to update quantity" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { itemId } = await req.json();

        await prisma.cartItem.delete({
            where: { id: itemId }
        });

        return NextResponse.json({ message: "Item removed from cart" });
    } catch (error: any) {
        console.error("Cart DELETE Error:", error);
        return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
    }
}
