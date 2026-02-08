import Navbar from "@/components/layout/navbar";
import { prisma } from "@/lib/prisma";
import { convertDriveLink } from "@/lib/utils-drive";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Metadata } from "next";
import Image from "next/image";
import { Flame } from "lucide-react";
import { parseProductsSearchParams } from "@/lib/products-search-params";
import { getProductsAndFacets, type ProductWithRelations, type ProductsFacets } from "@/lib/products-data";
import { ProductsFiltersSidebar } from "@/components/products/products-filters";

export async function generateMetadata({
    searchParams
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
    const raw = await searchParams;
    const { category, path, categoryId, q } = parseProductsSearchParams(raw);
    const { prisma } = await import("@/lib/prisma");
    let title = "All Collections | E-COM";
    let descLabel = "fashion";
    if (q) {
        title = `"${q}" | Search | E-COM`;
        descLabel = q;
    } else if (categoryId) {
        const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { name: true } });
        title = cat ? `${cat.name} | E-COM` : title;
        descLabel = cat?.name ?? descLabel;
    } else if (path) {
        title = `${path.replace(/^\//, "").replace(/\//g, " / ")} Collection | E-COM`;
        descLabel = path.replace(/^\//, "") || descLabel;
    } else if (category) {
        title = `${category} Collection | Make It Yours`;
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
        <section className="space-y-1">
            <div>
                
                <h2 className="md:text-xl text-sm font-bold text-primary">Check out our latest collections</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 lg:grid-cols-8 gap-4">
                {subcategories.map((sub: any) => {
                    const imgUrl = (sub.imageUrl || sub.iconUrl)
                        ? convertDriveLink(sub.imageUrl || sub.iconUrl)
                        : "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=400";
                    const href = `/products?categoryId=${encodeURIComponent(sub.id)}`;
                    return (
                        <Link
                            key={sub.id}
                            href={href}
                            className="group flex flex-col items-center text-center"
                        >
                            <div className="relative w-full aspect-square max-w-[75px] mx-auto rounded-full overflow-hidden ring-2 ring-neutral/10 ring-offset-2 ring-offset-background transition-all duration-300 group-hover:ring-[#62748e] group-hover:ring-offset-4 group-hover:scale-[1.02]">
                                <Image
                                    width={160}
                                    height={160}
                                    sizes="(max-width: 640px) 40vw, 160px"
                                    src={imgUrl}
                                    alt={sub.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden />
                            </div>
                            <span className="mt-3 block font-medium text-primary text-sm truncate w-full px-1 group-hover:text-primary/80 transition-colors">
                                {sub.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

/** Compare filter color with variant/image color (hex case-insensitive, else trim + lowercase). */
function colorMatches(filterColor: string, variantColor: string | null | undefined): boolean {
    if (variantColor == null || variantColor === "") return false;
    const a = filterColor.trim();
    const b = variantColor.trim();
    if (/^#[\da-fA-F]+$/.test(a) && /^#[\da-fA-F]+$/.test(b)) return a.toLowerCase() === b.toLowerCase();
    return a.toLowerCase() === b.toLowerCase();
}

/** Normalize color for grouping (one card per color, ignore size). */
function colorKey(c: string): string {
    const s = c.trim();
    return /^#[\da-fA-F]+$/.test(s) ? s.toLowerCase() : s.toLowerCase();
}

/** One card per color (ignore size): show each color as its own product card. */
function ProductGrid({
    products,
    selectedColors,
}: {
    products: ProductWithRelations[];
    selectedColors?: string[];
}) {
    const hasColorFilter = selectedColors && selectedColors.length > 0;
    const cards: { product: ProductWithRelations; variant: (typeof products)[0]["variants"][0]; colorKey: string }[] = [];
    for (const p of products) {
        const variants = p.variants ?? [];
        const byColor = new Map<string, (typeof variants)[0]>();
        for (const v of variants) {
            const key = colorKey(v.color);
            if (!byColor.has(key)) byColor.set(key, v);
        }
        const colorsToShow = hasColorFilter
            ? Array.from(byColor.entries()).filter(([, v]) => selectedColors!.some((c) => colorMatches(c, v.color)))
            : Array.from(byColor.entries());
        for (const [key, variant] of colorsToShow) {
            cards.push({ product: p, variant, colorKey: key });
        }
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {cards.map(({ product: p, variant, colorKey: cKey }) => {
                const imageForColor = p.images?.length
                    ? p.images.find((img) => colorMatches(variant.color, img.color ?? undefined))
                    : null;
                const image = imageForColor ?? p.images?.[0];
                return (
                    <Link key={`${p.id}-${cKey}`} href={`/product/${p.slug}?color=${encodeURIComponent(variant.color)}`} className="group space-y-4">
                        <div className="aspect-3/4 overflow-hidden rounded-2xl bg-neutral/5 relative">
                            {image && (
                                <Image
                                    width={400}
                                    height={400}
                                    src={convertDriveLink(image.driveUrl)}
                                    alt={`${p.name} (${variant.color})`}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            )}
                            <div className="absolute top-4 left-4 flex flex-col gap-0.5">
                                {variant.actualPrice != null && Number(variant.actualPrice) > Number(variant.price) && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-600 text-[10px] font-bold uppercase">
                                        {Math.round((1 - Number(variant.price) / Number(variant.actualPrice)) * 100)}% off
                                    </span>
                                )}
                                <span className="px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full text-xs font-bold text-primary">
                                    ₹{Math.round(Number(variant.price || 0))}
                                </span>
                            </div>
                            {p.isTrending && (
                                <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-bold uppercase shadow-sm">
                                    <Flame className="size-3.5" aria-hidden />
                                    <span>Trending</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-1 text-center">
                            <h3 className="font-bold text-lg group-hover:text-[#314158] transition">{p.name}</h3>
                           {/*  <p className="text-xs text-secondary/70 capitalize">{variant.color}</p> */}
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                {variant.actualPrice != null && Number(variant.actualPrice) > Number(variant.price) && (
                                    <span className="text-secondary/60 text-sm line-through">₹{Math.round(Number(variant.actualPrice))}</span>
                                )}
                                <span className="text-primary font-bold">₹{Math.round(Number(variant.price || 0))}</span>
                            </div>
                            <p className="text-secondary/60 text-sm">{p.category.name}</p>
                        </div>
                    </Link>
                );
            })}
            {cards.length === 0 && (
                <div className="col-span-full py-20 text-center text-secondary/50">
                    No products found.
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
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const raw = await searchParams;
    const params = parseProductsSearchParams(raw);
    const { products, facets } = await getProductsAndFacets(params);
    const { categoryId, path, category, q } = params;

    // Heading: search query, then category name from ID, then path, then slug
    let heading = "All Collections";
    if (q) {
        heading = `Search: "${q}"`;
    } else if (categoryId) {
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-4">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-primary capitalize">
                        {heading}
                    </h1>
                    <p className="text-secondary/70">
                        {q ? `${products.length} result${products.length !== 1 ? "s" : ""}` : "Expertly crafted pieces for a timeless wardrobe."}
                    </p>
                </div>

                <Suspense fallback={null}>
                    <SubcategoryCards categoryId={categoryId} categorySlug={category} categoryPath={path} />
                </Suspense>

                <ProductsFiltersSidebar params={params} facets={facets}>
                    <ProductGrid products={products} selectedColors={params.color} />
                </ProductsFiltersSidebar>
            </div>
        </div>
    );
}
