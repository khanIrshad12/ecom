import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    console.log("Fetching wishlist...");
    try {
        const session = await auth();
        console.log("Session:", JSON.stringify(session, null, 2));

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        console.log("UserId from session:", userId);

        if (!userId || userId === "admin-id") {
            console.error("Invalid user ID in session:", userId);
            return NextResponse.json({ error: "Invalid user session. Please logout and login again." }, { status: 400 });
        }

        const wishlist = await prisma.wishlist.findMany({
            where: { userId: userId },
            include: {
                product: {
                    include: {
                        category: true,
                        images: true,
                        variants: true,
                    }
                }
            }
        });
        console.log("Wishlist items found:", wishlist.length);
        return NextResponse.json(wishlist);
    } catch (error: any) {
        console.error("Failed to fetch wishlist - FULL ERROR:", error);
        return NextResponse.json({
            error: "Failed to fetch wishlist",
            details: error.message,
            code: error.code
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    console.log("Updating wishlist...");
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productId } = await req.json();
        const userId = (session.user as any).id;

        if (!userId || userId === "admin-id") {
            return NextResponse.json({ error: "Invalid user session. Please logout and login again." }, { status: 400 });
        }

        console.log("Request to toggle wishlist item:", { userId, productId });

        // Check if already in wishlist
        const existing = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                }
            }
        });

        if (existing) {
            console.log("Token exists, removing...");
            await prisma.wishlist.delete({
                where: {
                    userId_productId: {
                        userId,
                        productId,
                    }
                }
            });
            return NextResponse.json({ message: "Removed from wishlist", added: false });
        } else {
            console.log("Token missing, adding...");
            await prisma.wishlist.create({
                data: {
                    userId,
                    productId,
                }
            });
            return NextResponse.json({ message: "Added to wishlist", added: true });
        }
    } catch (error: any) {
        console.error("Failed to update wishlist - FULL ERROR:", error);
        return NextResponse.json({
            error: "Failed to update wishlist",
            details: error.message,
            code: error.code
        }, { status: 500 });
    }
}
