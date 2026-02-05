import Navbar from "@/components/layout/navbar";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ProductDetail from "@/components/product/product-detail";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const product = await prisma.product.findUnique({ where: { slug } });
    return {
        title: product ? `${product.name} | Premium E-COM` : "Product Not Found",
        description: product?.description || "High-quality fashion at E-COM.",
    };
}

export default async function ProductDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { slug } = await params;
    const raw = await searchParams;
    const colorFromUrl = typeof raw.color === "string" ? raw.color.trim() : undefined;

    const product = await prisma.product.findUnique({
        where: { slug },
        include: { images: true, variants: true, category: true },
    });

    if (!product) notFound();

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <ProductDetail product={product} initialColor={colorFromUrl} />
        </div>
    );
}
