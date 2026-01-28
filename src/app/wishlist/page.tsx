"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/navbar";
import { convertDriveLink } from "@/lib/utils-drive";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

export default function WishlistPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { addToCart } = useCart();
    const [wishlist, setWishlist] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login?callbackUrl=/wishlist");
        } else if (status === "authenticated") {
            fetchWishlist();
        }
    }, [status]);

    const fetchWishlist = async () => {
        try {
            const res = await fetch("/api/wishlist");
            if (res.ok) {
                const data = await res.json();
                setWishlist(data);
            }
        } catch (error) {
            toast.error("Failed to load wishlist");
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (productId: string) => {
        try {
            const res = await fetch("/api/wishlist", {
                method: "POST",
                body: JSON.stringify({ productId }),
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                setWishlist(prev => prev.filter(item => item.productId !== productId));
                toast.success("Removed from wishlist");
            }
        } catch (error) {
            toast.error("Failed to remove item");
        }
    };

    const moveToBag = async (item: any) => {
        const variant = item.product.variants[0];
        if (!variant) {
            toast.error("No variants available for this product");
            return;
        }

        try {
            await addToCart(item.productId, variant.id, 1);
            await removeFromWishlist(item.productId);
            toast.success("Moved to Bag!");
        } catch (error) {
            toast.error("Failed to move to bag");
        }
    };

    if (loading && status === "authenticated") {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-20 text-center">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-8">
                <div className="text-center py-10 space-y-4">
                    <h1 className="text-4xl font-bold text-primary">My Wishlist</h1>
                    <p className="text-secondary/70">{wishlist.length} {wishlist.length === 1 ? "Item" : "Items"} saved to your collection</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {wishlist.map((item: any) => (
                        <div key={item.id} className="group relative bg-white border border-neutral/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                            <Link href={`/product/${item.product.slug}`} className="block aspect-3/4 overflow-hidden bg-neutral/5">
                                {item.product.images[0] && (
                                    <Image
                                        width={400}
                                        height={400}
                                        src={convertDriveLink(item.product.images[0].driveUrl)}
                                        alt={item.product.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                )}
                                <div className="absolute top-4 left-4 px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full text-xs font-bold text-primary">
                                    ₹{item.product.variants[0]?.price || 0}
                                </div>
                            </Link>

                            <button
                                onClick={() => removeFromWishlist(item.productId)}
                                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 shadow-sm hover:bg-white transition-colors z-10"
                            >
                                <Heart className="w-5 h-5 fill-current" />
                            </button>

                            <div className="p-4 space-y-4">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-md text-primary truncate capitalize">{item.product.name}</h3>
                                    <p className="text-secondary/60 text-xs">{item.product.category.name}</p>
                                </div>
                                <Button
                                    onClick={() => moveToBag(item)}
                                    className="w-full bg-[#1a1a1a] hover:bg-black text-white text-xs font-bold rounded-lg h-10 gap-2"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    MOVE TO BAG
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {wishlist.length === 0 && !loading && (
                    <div className="text-center py-20 space-y-6">
                        <div className="w-20 h-20 bg-neutral/5 rounded-full flex items-center justify-center mx-auto text-neutral/40">
                            <Heart className="w-10 h-10 text-neutral/30" />
                        </div>
                        <p className="text-secondary/50">Your wishlist is empty.</p>
                        <Link href="/products">
                            <Button className="px-8 h-12 rounded-full font-bold">Start Shopping</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
