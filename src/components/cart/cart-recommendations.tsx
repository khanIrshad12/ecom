"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { convertDriveLink } from "@/lib/utils-drive";

type Product = {
    id: string;
    name: string;
    slug: string;
    description?: string;
    categoryId?: string;
    images: { driveUrl: string; id?: string }[];
    variants: { price: number; actualPrice?: number | null; id?: string }[];
    category: { name: string };
};

export default function CartRecommendations({ cartProductIds }: { cartProductIds: string[] }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/recommendations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ cartProductIds, limit: 8 }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data);
                }
            } catch (error) {
                console.error("Failed to fetch recommendations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [cartProductIds]);

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-3/4 bg-neutral/10 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => {
                const price = p.variants[0]?.price || 0;
                const actualPrice = p.variants[0]?.actualPrice;
                const hasDiscount = actualPrice != null && Number(actualPrice) > price;
                const discountPercent = hasDiscount
                    ? Math.round((1 - price / Number(actualPrice)) * 100)
                    : 0;

                return (
                    <Link key={p.id} href={`/product/${p.slug}`} className="group space-y-3">
                        <div className="aspect-3/4 overflow-hidden rounded-xl bg-neutral/5 relative shadow-[0px_11px_20px_8px_rgba(0,0,0,0.33)]">
                            {p.images[0] && (
                                <Image
                                    width={300}
                                    height={400}
                                    src={convertDriveLink(p.images[0].driveUrl)}
                                    alt={p.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            )}
                           {/*  <div className="absolute top-0 left-0 right-0 h-16 rounded-t-xl bg-gradient-to-b from-black/70 to-transparent pointer-events-none" aria-hidden />
                            <div className="absolute bottom-0 left-0 right-0 h-16 rounded-b-xl bg-gradient-to-t from-black/60 to-transparent pointer-events-none" aria-hidden /> */}
                            <div className="absolute top-3 left-3 flex flex-col gap-0.5 z-10">
                                {hasDiscount && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-600 text-[10px] font-bold uppercase">
                                        {discountPercent}% off
                                    </span>
                                )}
                                <span className="px-2.5 py-1 bg-background/90 backdrop-blur-sm rounded-full text-xs font-bold text-primary">
                                    ₹{Math.round(price)}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-sm sm:text-base group-hover:text-[#314158] transition line-clamp-2">
                                {p.name}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                                {hasDiscount && (
                                    <span className="text-secondary/60 text-xs line-through">
                                        ₹{Math.round(Number(actualPrice))}
                                    </span>
                                )}
                                <span className="text-primary font-bold text-sm">₹{Math.round(price)}</span>
                            </div>
                            <p className="text-secondary/60 text-xs">{p.category.name}</p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
