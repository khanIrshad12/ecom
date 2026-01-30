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
    searchParams: Promise<{ category?: string; path?: string; categoryId?: string }>
}): Promise<Metadata> {
    const { category, path, categoryId } = await searchParams;
    const { prisma } = await import("@/lib/prisma");
    let title = "All Collections | E-COM";
    let descLabel = "fashion";
    if (categoryId) {
        const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { name: true } });
        title = cat ? `${cat.name} | E-COM` : title;
        descLabel = cat?.name ?? descLabel;
    } else if (path) {
        title = `${path.replace(/^\//, "").replace(/\//g, " / ")} Collection | E-COM`;
        descLabel = path.replace(/^\//, "") || descLabel;
    } else if (category) {
        title = `${category} Collection | E-COM`;
        descLabel = category;
    }
    return {
        title,
        description: `Browse our latest ${descLabel} items. Premium quality, best prices.`,
    };
}

async function SubcategoryCards({
    categoryId,
    categoryPath,
    categorySlug,
}: {
    categoryId?: string;
    categoryPath?: string;
    categorySlug?: string;
}) {
    let currentCategory: { id: string; path: string } | null = null;
    if (categoryId) {
        const cat = await prisma.category.findFirst({
            where: { id: categoryId, isActive: true },
            select: { id: true, path: true },
        });
        currentCategory = cat;
    }
    if (!currentCategory) {
        const pathFromUrl = categoryPath?.replace(/\/$/, "").replace(/^\/*/, "/") || undefined;
        const slugFromPath = pathFromUrl?.replace(/^\//, "").toLowerCase();
        if (pathFromUrl) {
            let cat = await prisma.category.findFirst({
                where: { path: pathFromUrl, isActive: true },
                select: { id: true, path: true },
            });
            if (!cat && slugFromPath) {
                cat = await prisma.category.findFirst({
                    where: { slug: slugFromPath, isActive: true },
                    select: { id: true, path: true },
                });
            }
            currentCategory = cat;
        } else if (categorySlug) {
            const cat = await prisma.category.findFirst({
                where: { slug: categorySlug, isActive: true },
                select: { id: true, path: true },
            });
            currentCategory = cat;
        }
    }
    if (!currentCategory) return null;

    const subcategories = await prisma.category.findMany({
        where: { parentId: currentCategory.id, isActive: true, showInNav: true },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true, path: true, imageUrl: true, iconUrl: true },
    });
    if (subcategories.length === 0) return null;

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary">Subcategories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {subcategories.map((sub: any) => {
                    const imgUrl = (sub.imageUrl || sub.iconUrl)
                        ? convertDriveLink(sub.imageUrl || sub.iconUrl)
                        : "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=400";
                    const href = `/products?categoryId=${encodeURIComponent(sub.id)}`;
                    return (
                        <Link
                            key={sub.id}
                            href={href}
                            className="group block rounded-xl overflow-hidden border border-neutral/20 bg-neutral/5 hover:border-primary/30 transition"
                        >
                            <div className="aspect-square relative overflow-hidden bg-muted/50">
                                <img
                                    src={imgUrl}
                                    alt={sub.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>
                            <div className="p-3 text-center">
                                <p className="font-medium text-primary truncate">{sub.name}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

async function ProductGrid({
    categoryId,
    categoryPath,
    categorySlug,
}: {
    categoryId?: string;
    categoryPath?: string;
    categorySlug?: string;
}) {
    // Prefer categoryId (parent ID in route) — unambiguous, no path/slug mismatch
    let categoryIds: string[] | null = null;
    const hasCategoryFilter = Boolean(categoryId || categoryPath || categorySlug);

    if (categoryId) {
        // This category + all descendants: self + direct children (parentId) + recurse so "all products" includes every subcategory
        const cat = await prisma.category.findUnique({
            where: { id: categoryId },
            select: { id: true, name: true, isActive: true },
        });
        console.log(`[ProductGrid] CategoryId: ${categoryId}, found category:`, cat);
        if (cat && cat.isActive) {
            const ids = new Set<string>([cat.id]);
            let toExpand: string[] = [cat.id];
            let iteration = 0;
            while (toExpand.length > 0 && iteration < 10) {
                iteration++;
                console.log(`[ProductGrid] Iteration ${iteration}, expanding:`, toExpand);
                const children = await prisma.category.findMany({
                    where: { isActive: true, parentId: { in: toExpand } },
                    select: { id: true, name: true },
                });
                console.log(`[ProductGrid] Found ${children.length} children:`, children.map(c => ({ id: c.id, name: c.name })));
                children.forEach((c) => ids.add(c.id));
                toExpand = children.map((c) => c.id);
            }
            categoryIds = Array.from(ids);
            console.log(`[ProductGrid] Category: ${cat.name}, collected ${categoryIds.length} category IDs:`, categoryIds);
        } else {
            console.log(`[ProductGrid] Category NOT FOUND for id:`, categoryId);
            categoryIds = [];
        }
    } else {
        let dbPath: string | undefined;
        const pathFromUrl = categoryPath?.replace(/\/$/, "").replace(/^\/*/, "/") || undefined;
        const slugFromPath = pathFromUrl?.replace(/^\//, "").toLowerCase();

        if (pathFromUrl) {
            const byPath = await prisma.category.findFirst({
                where: { path: pathFromUrl, isActive: true },
                select: { path: true },
            });
            const bySlug = !byPath && slugFromPath
                ? await prisma.category.findFirst({
                    where: { slug: slugFromPath, isActive: true },
                    select: { path: true },
                })
                : null;
            dbPath = byPath?.path ?? bySlug?.path ?? undefined;
        } else if (categorySlug) {
            const cat = await prisma.category.findUnique({
                where: { slug: categorySlug },
                select: { path: true, isActive: true },
            });
            dbPath = cat?.isActive ? (cat.path || `/${categorySlug}`) : undefined;
        } else {
            dbPath = undefined;
        }

        if (dbPath) {
            const matchingCategories = await prisma.category.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { path: dbPath },
                        { path: { startsWith: dbPath + "/" } },
                    ],
                },
                select: { id: true },
            });
            categoryIds = matchingCategories.map((c) => c.id);
        } else if (hasCategoryFilter) {
            categoryIds = [];
        }
    }

    const productWhere = categoryIds === null ? undefined : { categoryId: { in: categoryIds } };
    const products = await prisma.product.findMany({
        where: productWhere,
        include: { images: true, variants: true, category: true },
    });
    
    if (categoryId) {
        console.log(`[ProductGrid] Found ${products.length} products for categoryIds:`, categoryIds);
        if (products.length === 0 && categoryIds && categoryIds.length > 0) {
            // Check if products exist at all with these category IDs
            const allProducts = await prisma.product.findMany({
                select: { id: true, name: true, categoryId: true },
            });
            console.log(`[DEBUG] Total products in DB: ${allProducts.length}`);
            console.log(`[DEBUG] Products by category:`, allProducts.map(p => ({ name: p.name, categoryId: p.categoryId })));
        }
    }

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
                        <div className="absolute top-4 left-4 flex flex-col gap-0.5">
                            {(p.variants[0] as any)?.actualPrice != null && Number((p.variants[0] as any).actualPrice) > Number(p.variants[0]?.price) && (
                                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-600 text-[10px] font-bold uppercase">
                                    {Math.round((1 - Number(p.variants[0]?.price) / Number((p.variants[0] as any).actualPrice)) * 100)}% off
                                </span>
                            )}
                            <span className="px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full text-xs font-bold text-primary">
                                ₹{Math.round(Number(p.variants[0]?.price || 0))}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1 text-center">
                        <h3 className="font-bold text-lg group-hover:text-[#314158] transition">{p.name}</h3>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                            {(p.variants[0] as any)?.actualPrice != null && Number((p.variants[0] as any).actualPrice) > Number(p.variants[0]?.price) && (
                                <span className="text-secondary/60 text-sm line-through">₹{Math.round(Number((p.variants[0] as any).actualPrice))}</span>
                            )}
                            <span className="text-primary font-bold">₹{Math.round(Number(p.variants[0]?.price || 0))}</span>
                        </div>
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
    searchParams: Promise<{ category?: string; path?: string; categoryId?: string }>;
}) {
    const { category, path, categoryId } = await searchParams;

    // Heading: prefer category name from ID, then path, then slug
    let heading = "All Collections";
    if (categoryId) {
        const cat = await prisma.category.findUnique({
            where: { id: categoryId },
            select: { name: true },
        });
        heading = cat?.name ?? heading;
    } else if (path) {
        heading = path.split("/").filter(Boolean).join(" / ") || "Collection";
    } else if (category) {
        heading = `${category} Collection`;
    }

    return (
        <div className="min-h-screen pb-20">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-8">
                <div className="text-center py-10 space-y-4">
                    <h1 className="text-4xl font-bold text-primary capitalize">
                        {heading}
                    </h1>
                    <p className="text-secondary/70">Expertly crafted pieces for a timeless wardrobe.</p>
                </div>

                <Suspense fallback={null}>
                    <SubcategoryCards categoryId={categoryId} categorySlug={category} categoryPath={path} />
                </Suspense>

                <Suspense fallback={<GridSkeleton />}>
                    <ProductGrid categoryId={categoryId} categorySlug={category} categoryPath={path} />
                </Suspense>
            </div>
        </div>
    );
}
