"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingCart, User, Menu, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

export default function Navbar() {
    const { cartCount } = useCart();
    const [categories, setCategories] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetch("/api/categories")
            .then(res => res.json())
            .then(data => setCategories(data.filter((c: any) => !c.parentId)));
    }, []);

    return (
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-neutral/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <Link href="/" className="text-2xl font-bold text-primary tracking-tighter">
                        E-COM<span className="text-accent">.</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex space-x-8 items-center">
                        {categories.map((cat) => (
                            <Link key={cat.id} href={`/category/${cat.slug}`} className="text-secondary hover:text-primary transition font-medium">
                                {cat.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center space-x-4">
                        <Link href="/wishlist">
                            <Button variant="ghost" size="icon" className="text-secondary hover:text-primary">
                                <Heart className="w-6 h-6" />
                            </Button>
                        </Link>
                        <Link href="/cart">
                            <Button variant="ghost" size="icon" className="relative text-secondary hover:text-primary">
                                <ShoppingCart className="w-6 h-6" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-primary text-background text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                        {cartCount}
                                    </span>
                                )}
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="ghost" size="icon" className="text-secondary hover:text-primary">
                                <User className="w-6 h-6" />
                            </Button>
                        </Link>
                        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
                            {isOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            {isOpen && (
                <div className="md:hidden bg-background border-b border-neutral/10 p-4 space-y-4">
                    {categories.map((cat) => (
                        <Link key={cat.id} href={`/category/${cat.slug}`} className="block text-lg font-medium text-secondary">
                            {cat.name}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
}
