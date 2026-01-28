import Navbar from "@/components/layout/navbar";
import { prisma } from "@/lib/prisma";
import { convertDriveLink } from "@/lib/utils-drive";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Metadata } from "next";
import Image from "next/image";

export async function generateMetadata({
    searchParams
}: {
    searchParams: Promise<{ category?: string }>
}): Promise<Metadata> {
    const { category } = await searchParams;
    return {
        title: category ? `${category} Collection | E-COM` : "All Collections | E-COM",
        description: `Browse our latest ${category || "fashion"} items. Premium quality, best prices.`,
    };
}

async function ProductGrid({ categorySlug }: { categorySlug?: string }) {
    const products = await prisma.product.findMany({
        where: categorySlug ? {
            category: {
                OR: [
                    { slug: categorySlug },
                    { parent: { slug: categorySlug } }
                ]
            }
        } : {},
        include: { images: true, variants: true, category: true },
    });

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((p: any) => (
                <Link key={p.id} href={`/product/${p.slug}`} className="group space-y-4">
                    <div className="aspect-3/4 overflow-hidden rounded-2xl bg-neutral/5 relative">
                        {p.images[0] && (
                            <Image
                                width={400}
                                height={400}
                                src={convertDriveLink(p.images[0].driveUrl)}
                                alt={p.name}

                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        )}
                        <div className="absolute top-4 left-4 px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full text-xs font-bold text-primary">
                            ₹{p.variants[0]?.price || 0}
                        </div>
                    </div>
                    <div className="space-y-1 text-center">
                        <h3 className="font-bold text-lg group-hover:text-[#314158] transition">{p.name}</h3>
                        <p className="text-secondary/60 text-sm">{p.category.name}</p>
                    </div>
                </Link>
            ))}
            {products.length === 0 && (
                <div className="col-span-full py-20 text-center text-secondary/50">
                    No products found in this category.
                </div>
            )}
        </div>
    );
}

function GridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="space-y-4">
                    <Skeleton className="aspect-3/4 rounded-2xl w-full" />
                    <Skeleton className="h-6 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                </div>
            ))}
        </div>
    );
}

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string }>;
}) {
    const { category } = await searchParams;

    return (
        <div className="min-h-screen pb-20">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-8">
                <div className="text-center py-10 space-y-4">
                    <h1 className="text-4xl font-bold text-primary capitalize">
                        {category ? `${category} Collection` : "All Collections"}
                    </h1>
                    <p className="text-secondary/70">Expertly crafted pieces for a timeless wardrobe.</p>
                </div>

                <Suspense fallback={<GridSkeleton />}>
                    <ProductGrid categorySlug={category} />
                </Suspense>
            </div>
        </div>
    );
}
