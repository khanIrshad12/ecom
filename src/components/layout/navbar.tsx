"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingCart, User, Menu, X, Heart, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { getDrivePreviewUrl } from "@/lib/utils-drive";

type NavCategory = {
    id: string;
    name: string;
    slug: string;
    path?: string;
    imageUrl?: string | null;
    iconUrl?: string | null;
    isActive?: boolean;
    showInNav?: boolean;
    children?: NavCategory[];
};

function navCategoryImageUrl(cat: NavCategory): string {
    const url = cat.imageUrl || cat.iconUrl;
    return url ? getDrivePreviewUrl(url) : "";
}

export default function Navbar() {
    const { cartCount } = useCart();
    const [categories, setCategories] = useState<NavCategory[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/categories")
            .then(res => res.json())
            .then(data => {
                const tree = Array.isArray(data?.tree) ? data.tree : [];
                setCategories(
                    tree.filter((c: NavCategory) => c.isActive !== false && c.showInNav !== false)
                );
            });
    }, []);

    return (
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-neutral/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <Link href="/" className="text-2xl font-bold text-primary tracking-tighter">
                        E-COM<span className="text-accent">.</span>
                    </Link>

                    {/* Desktop Nav with dropdowns */}
                    <div className="hidden md:flex items-center gap-1">
                        {categories.map((cat) => {
                            const visibleChildren = (cat.children ?? []).filter(
                                (c: NavCategory) => c.isActive !== false && c.showInNav !== false
                            );
                            const hasChildren = visibleChildren.length > 0;
                            const imgUrl = navCategoryImageUrl(cat);
                            const href = `/products?categoryId=${encodeURIComponent(cat.id)}`;
                            return (
                                <div
                                    key={cat.id}
                                    className="relative group"
                                    onMouseEnter={() => setOpenDropdownId(cat.id)}
                                    onMouseLeave={() => setOpenDropdownId(null)}
                                >
                                    <Link
                                        href={href}
                                        className="flex items-center gap-1 py-2 px-2 text-secondary hover:text-primary transition font-medium rounded-md"
                                    >
                                        {imgUrl ? (
                                            <span className="shrink-0 w-6 h-6 rounded overflow-hidden border border-neutral/20 bg-muted/50">
                                                <img
                                                    src={imgUrl}
                                                    alt=""
                                                    referrerPolicy="no-referrer"
                                                    className="w-full h-full object-cover"
                                                />
                                            </span>
                                        ) : null}
                                        <span>{cat.name}</span>
                                        {hasChildren ? <ChevronDown className="w-4 h-4 opacity-60" /> : null}
                                    </Link>
                                    {(hasChildren || imgUrl) && openDropdownId === cat.id && (
                                        <div className="absolute left-0 top-full pt-1 z-50 min-w-[280px]">
                                            <div className="bg-background border border-neutral/20 rounded-lg shadow-lg overflow-hidden">
                                                <Link
                                                    href={href}
                                                    className="flex items-center gap-3 p-4 hover:bg-neutral/5 transition"
                                                >
                                                    {imgUrl ? (
                                                        <span className="shrink-0 w-14 h-14 rounded-md overflow-hidden border border-neutral/20 bg-muted/50">
                                                            <img
                                                                src={imgUrl}
                                                                alt=""
                                                                referrerPolicy="no-referrer"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </span>
                                                    ) : null}
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-primary">{cat.name}</p>
                                                        <p className="text-xs text-secondary">Shop all</p>
                                                    </div>
                                                </Link>
                                                {hasChildren && (
                                                    <div className="border-t border-neutral/10 p-2 pb-3">
                                                        <p className="text-xs font-medium text-secondary px-2 py-1">Subcategories</p>
                                                        <div className="grid grid-cols-2 gap-1">
                                                            {visibleChildren.map((child) => {
                                                                const childImg = navCategoryImageUrl(child);
                                                                const childHref = `/products?categoryId=${encodeURIComponent(child.id)}`;
                                                                return (
                                                                    <Link
                                                                        key={child.id}
                                                                        href={childHref}
                                                                        className="flex items-center gap-2 p-2 rounded-md hover:bg-neutral/5 transition"
                                                                    >
                                                                        {childImg ? (
                                                                            <span className="shrink-0 w-8 h-8 rounded overflow-hidden border border-neutral/20 bg-muted/50">
                                                                                <img
                                                                                    src={childImg}
                                                                                    alt=""
                                                                                    referrerPolicy="no-referrer"
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                            </span>
                                                                        ) : null}
                                                                        <span className="text-sm font-medium text-primary truncate">{child.name}</span>
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
                <div className="md:hidden bg-background border-b border-neutral/10 p-4 space-y-2">
                    {categories.map((cat) => {
                        const imgUrl = navCategoryImageUrl(cat);
                        const href = `/products?categoryId=${encodeURIComponent(cat.id)}`;
                        return (
                            <Link
                                key={cat.id}
                                href={href}
                                className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-neutral/5 text-secondary hover:text-primary transition"
                            >
                                {imgUrl ? (
                                    <span className="shrink-0 w-10 h-10 rounded-md overflow-hidden border border-neutral/20 bg-muted/50">
                                        <img
                                            src={imgUrl}
                                            alt=""
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover"
                                        />
                                    </span>
                                ) : null}
                                <span className="font-medium">{cat.name}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </nav>
    );
}
