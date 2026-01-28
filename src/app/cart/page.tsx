"use client";

import React from "react";
import Navbar from "@/components/layout/navbar";
import { useCart } from "@/lib/cart-context";
import { convertDriveLink } from "@/lib/utils-drive";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CartPage() {
    const { items, loading, updateQuantity, removeFromCart, totalAmount, cartCount } = useCart();

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
                <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
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
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-extrabold text-primary tracking-tighter mb-10">
                    YOUR BAG <span className="text-secondary/40 font-normal text-2xl ml-2">({cartCount} items)</span>
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Cart Items */}
                    <div className="lg:col-span-8 space-y-8">
                        {items.map((item) => (
                            <div key={item.id} className="flex gap-6 group">
                                <Link
                                    href={`/product/${item.product.slug}`}
                                    className="relative aspect-[3/4] w-32 sm:w-40 bg-neutral/5 overflow-hidden flex-shrink-0"
                                >
                                    <Image
                                        src={convertDriveLink(item.product.images[0]?.driveUrl)}
                                        alt={item.product.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                </Link>

                                <div className="flex flex-col flex-grow justify-between py-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs font-bold text-secondary/60 tracking-widest uppercase mb-1">
                                                {item.product.category.name}
                                            </p>
                                            <Link href={`/product/${item.product.slug}`}>
                                                <h3 className="text-xl font-bold text-primary hover:underline decoration-accent underline-offset-4">
                                                    {item.product.name}
                                                </h3>
                                            </Link>
                                            <p className="text-sm text-secondary mt-1">
                                                <span className="inline-flex items-center gap-2">
                                                    {isHexColor(item.variant.color) ? (
                                                        <span
                                                            className="inline-block h-4 w-4 rounded-full border border-neutral/30"
                                                            style={{ backgroundColor: item.variant.color }}
                                                            aria-label={`Color ${item.variant.color}`}
                                                            title={item.variant.color}
                                                        />
                                                    ) : (
                                                        <span className="font-medium">{item.variant.color}</span>
                                                    )}
                                                    <span>/</span>
                                                    <span>{item.variant.size}</span>
                                                </span>
                                            </p>
                                        </div>
                                        <p className="text-lg font-bold text-primary">
                                            ₹{(item.variant.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between mt-6">
                                        <div className="flex items-center border border-neutral/20 rounded-sm">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="p-3 hover:bg-neutral/5 text-secondary"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-12 text-center font-bold text-primary">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="p-3 hover:bg-neutral/5 text-secondary"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-4 mt-12 lg:mt-0">
                        <div className="bg-neutral/5 p-8 rounded-sm sticky top-24 border border-neutral/10">
                            <h2 className="text-2xl font-bold text-primary mb-6">SUMMARY</h2>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-secondary">
                                    <span>Subtotal</span>
                                    <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-secondary">
                                    <span>Estimated Shipping</span>
                                    <span className="font-medium">₹0.00</span>
                                </div>
                                <div className="flex justify-between text-secondary">
                                    <span>Estimated Tax</span>
                                    <span className="font-medium">₹0.00</span>
                                </div>
                                <div className="h-[1px] bg-neutral/10 w-full" />
                                <div className="flex justify-between text-xl font-bold text-primary">
                                    <span>Total</span>
                                    <span>₹{totalAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            <Button className="w-full h-14 rounded-sm font-bold tracking-widest gap-2">
                                PROCEED TO CHECKOUT
                                <ArrowRight className="w-5 h-5" />
                            </Button>

                            <div className="mt-8 space-y-4">
                                <p className="text-xs text-secondary/60 text-center uppercase tracking-widest leading-relaxed">
                                    Free shipping on all orders over ₹200. Secure checkout powered by Stripe.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommendations or footer space */}
                <div className="mt-24">
                    <h2 className="text-2xl font-bold text-primary mb-8 tracking-tight">YOU MAY ALSO LIKE</h2>
                    {/* Placeholder for recommendations */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 opacity-40 grayscale">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-[3/4] bg-neutral/10 rounded-sm" />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
