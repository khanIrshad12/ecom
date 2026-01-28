"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface CartItem {
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    product: {
        name: string;
        slug: string;
        images: { driveUrl: string }[];
        category: { name: string };
    };
    variant: {
        color: string;
        size: string;
        price: number;
    };
}

interface CartContextType {
    items: CartItem[];
    loading: boolean;
    fetchCart: () => Promise<void>;
    addToCart: (productId: string, variantId: string, quantity: number) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    cartCount: number;
    totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchCart = useCallback(async () => {
        if (status !== "authenticated") return;
        setLoading(true);
        try {
            const res = await fetch("/api/cart");
            if (res.ok) {
                const data = await res.json();
                setItems(data.items || []);
            }
        } catch (error) {
            console.error("Fetch cart error:", error);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const addToCart = async (productId: string, variantId: string, quantity: number) => {
        if (status !== "authenticated") {
            toast.error("Please login to add to cart");
            return;
        }
        try {
            const res = await fetch("/api/cart", {
                method: "POST",
                body: JSON.stringify({ productId, variantId, quantity }),
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                toast.success("Added to cart");
                fetchCart();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to add to cart");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        try {
            const res = await fetch("/api/cart", {
                method: "PATCH",
                body: JSON.stringify({ itemId, quantity }),
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                fetchCart();
            }
        } catch (error) {
            toast.error("Failed to update quantity");
        }
    };

    const removeFromCart = async (itemId: string) => {
        try {
            const res = await fetch("/api/cart", {
                method: "DELETE",
                body: JSON.stringify({ itemId }),
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                toast.success("Removed from cart");
                fetchCart();
            }
        } catch (error) {
            toast.error("Failed to remove item");
        }
    };

    const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const totalAmount = items.reduce((acc, item) => acc + (item.variant.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ items, loading, fetchCart, addToCart, updateQuantity, removeFromCart, cartCount, totalAmount }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
