"use client";

import React from "react";
import Navbar from "@/components/layout/navbar";
import { useCart } from "@/lib/cart-context";
import { convertDriveLink } from "@/lib/utils-drive";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CartRecommendations from "@/components/cart/cart-recommendations";

export default function CartPage() {
    const { items, loading, updateQuantity, removeFromCart, totalAmount, cartCount } = useCart();

    const totalSavings = React.useMemo(() => {
        return items.reduce((sum, item) => {
            const actual = Number(item.variant.actualPrice);
            const selling = Number(item.variant.price);
            if (actual > selling) return sum + Math.round((actual - selling) * item.quantity);
            return sum;
        }, 0);
    }, [items]);

    const isHexColor = (value: unknown): value is string => {
        if (typeof value !== "string") return false;
        const v = value.trim();
        return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex flex-col items-center justify-center text-center py-12">
                        <div className="w-20 h-20 bg-neutral/5 rounded-full flex items-center justify-center mb-6">
                            <ShoppingBag className="w-10 h-10 text-secondary/40" />
                        </div>
                        <h1 className="text-3xl font-bold text-primary mb-2">Your Bag is Empty</h1>
                        <p className="text-secondary max-w-md mb-8">
                            It looks like you haven't added anything to your bag yet.
                            Start exploring our latest collections and find something you love.
                        </p>
                        <Link href="/products">
                            <Button className="h-14 px-10 rounded-sm font-bold tracking-wide">
                                SHOP NOW
                            </Button>
                        </Link>
                    </div>

                    {/* Show recommendations even when cart is empty */}
                    <div className="mt-12">
                        <h2 className="text-xl font-bold text-primary mb-6 tracking-tight">Trending Products</h2>
                        <CartRecommendations cartProductIds={[]} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-10">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tighter">
                        Your bag
                    </h1>
                    <p className="text-secondary/70 mt-1 text-sm sm:text-base">
                        {cartCount} {cartCount === 1 ? "item" : "items"}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-8 space-y-4">
                        {items.map((item) => {
                            const stock = item.variant.stock ?? Infinity;
                            const atMaxStock = stock !== Infinity && item.quantity >= stock;
                            const handleIncrement = () => {
                                if (stock !== Infinity && item.quantity >= stock) {
                                    toast.error(`Only ${stock} in stock`);
                                    return;
                                }
                                updateQuantity(item.id, item.quantity + 1);
                            };
                            return (
                                <div
                                    key={item.id}
                                    className="flex gap-6 p-4 sm:p-5 rounded-xl border border-neutral/15 bg-background hover:border-neutral/25 transition group"
                                >
                                    <Link
                                        href={`/product/${item.product.slug}`}
                                        className="relative aspect-3/4 w-28 sm:w-36 bg-neutral/5 overflow-hidden shrink-0 rounded-lg"
                                    >
                                        <Image
                                            src={convertDriveLink(item.product.images[0]?.driveUrl)}
                                            alt={item.product.name}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </Link>

                                    <div className="flex flex-col grow justify-between py-0.5 min-w-0">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-secondary/60 tracking-widest uppercase mb-0.5">
                                                    {item.product.category.name}
                                                </p>
                                                <Link href={`/product/${item.product.slug}`}>
                                                    <h3 className="text-base sm:text-lg font-bold text-primary hover:underline decoration-accent underline-offset-2 truncate">
                                                        {item.product.name}
                                                    </h3>
                                                </Link>
                                                <p className="text-sm text-secondary mt-1.5 flex items-center gap-2 flex-wrap">
                                                   Color: {isHexColor(item.variant.color) ? (
                                                        <span
                                                            className="inline-block h-4 w-4 rounded-full border border-neutral/30 shrink-0"
                                                            style={{ backgroundColor: item.variant.color }}
                                                            aria-label={`Color ${item.variant.color}`}
                                                            title={item.variant.color}
                                                        />
                                                    ) : (
                                                        <span className="font-medium">{item.variant.color}</span>
                                                    )}
                                                   
                                                    <span> Size: {item.variant.size}</span>
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                {item.variant.actualPrice != null && Number(item.variant.actualPrice) > Number(item.variant.price) && (
                                                    <span className="text-sm text-secondary/70 line-through block">
                                                        ₹{Math.round(Number(item.variant.actualPrice)) * item.quantity}
                                                    </span>
                                                )}
                                                <p className="text-lg font-bold text-primary">
                                                    ₹{Math.round(Number(item.variant.price)) * item.quantity}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center border border-neutral/20 rounded-lg bg-neutral/5">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                        className="p-2.5 sm:p-3 hover:bg-neutral/10 text-secondary rounded-l-lg transition"
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-10 text-center font-bold text-primary text-sm">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={handleIncrement}
                                                        disabled={atMaxStock}
                                                        className={`p-2.5 sm:p-3 rounded-r-lg transition ${
                                                            atMaxStock
                                                                ? "text-secondary/40 cursor-not-allowed"
                                                                : "hover:bg-neutral/10 text-secondary"
                                                        }`}
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                {stock !== Infinity && (
                                                    <p className={`text-xs ${atMaxStock ? "text-amber-600 font-medium" : "text-secondary/60"}`}>
                                                        {atMaxStock ? `Only ${stock} in stock` : ``}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-zinc-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1.5" />
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-4 mt-8 lg:mt-0">
                        <div className="bg-neutral/5 p-6 sm:p-8 rounded-xl sticky top-24 border border-neutral/15 shadow-sm">
                            <h2 className="text-lg font-bold text-primary mb-6">Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-secondary text-sm">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-primary">₹{Math.round(totalAmount)}</span>
                                </div>
                                {totalSavings > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary">You save</span>
                                        <span className="font-semibold text-emerald-600">₹{Math.round(totalSavings)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-secondary text-sm">
                                    <span>Shipping</span>
                                    <span className="font-medium">₹0</span>
                                </div>
                                <div className="flex justify-between text-secondary text-sm">
                                    <span>Tax</span>
                                    <span className="font-medium">₹0</span>
                                </div>
                                <div className="h-px bg-neutral/20 w-full my-3" />
                                <div className="flex justify-between text-lg font-bold text-primary">
                                    <span>Total</span>
                                    <span>₹{Math.round(totalAmount)}</span>
                                </div>
                            </div>

                            <Button className="w-full h-12 sm:h-14 rounded-lg font-bold tracking-wide gap-2 bg-primary hover:bg-primary/90">
                                Proceed to checkout
                                <ArrowRight className="w-5 h-5" />
                            </Button>

                            <p className="mt-6 text-xs text-secondary/60 text-center leading-relaxed">
                                Free shipping on orders over ₹200. Secure checkout powered by Stripe.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="mt-16">
                    <h2 className="text-xl font-bold text-primary mb-6 tracking-tight">You may also like</h2>
                    <CartRecommendations cartProductIds={items.map(item => item.product.id)} />
                </div>
            </main>
        </div>
    );
}
