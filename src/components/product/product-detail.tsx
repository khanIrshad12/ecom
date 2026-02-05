"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { convertDriveLink } from "@/lib/utils-drive";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, ChevronLeft, ChevronRight, Ruler } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { getColorSwatchValue, getColorDisplayName } from "@/lib/utils-color";

const RevealWaveImage = dynamic(
    () => import("@/components/ui/reveal-wave-image").then((m) => m.RevealWaveImage),
    { ssr: false, loading: () => <div className="w-full h-full bg-neutral/10 animate-pulse" /> }
);

function colorMatches(a: string, b: string | null | undefined): boolean {
    if (b == null || b === "") return false;
    const x = a.trim();
    const y = b.trim();
    if (/^#[\da-fA-F]+$/.test(x) && /^#[\da-fA-F]+$/.test(y)) return x.toLowerCase() === y.toLowerCase();
    return x.toLowerCase() === y.toLowerCase();
}

function resolveInitialColor(product: any, initialColorFromUrl: string | undefined): string | undefined {
    if (!initialColorFromUrl || !product.variants?.length) return product.variants?.[0]?.color;
    const match = product.variants.find((v: any) => colorMatches(initialColorFromUrl, v.color));
    return match ? match.color : product.variants[0]?.color;
}

interface ProductDetailProps {
    product: any;
    initialColor?: string;
}

export default function ProductDetail({ product, initialColor }: ProductDetailProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const { addToCart } = useCart();
    const resolvedInitial = resolveInitialColor(product, initialColor);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedColor, setSelectedColor] = useState(resolvedInitial);
    const [selectedSize, setSelectedSize] = useState(() => {
        const forColor = product.variants?.filter((v: any) => colorMatches(resolvedInitial ?? "", v.color)) ?? [];
        const inStock = forColor.find((v: any) => (v.stock ?? 0) > 0);
        return inStock ? inStock.size : forColor[0]?.size ?? product.variants?.[0]?.size;
    });
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    useEffect(() => {
        if (session) {
            fetchWishlistStatus();
        }
    }, [session, product.id]);

    useEffect(() => {
        const resolved = resolveInitialColor(product, initialColor);
        if (resolved && resolved !== selectedColor) {
            setSelectedColor(resolved);
            setSelectedImage(0);
            const forColor = product.variants?.filter((v: any) => colorMatches(resolved, v.color)) ?? [];
            const inStock = forColor.find((v: any) => (v.stock ?? 0) > 0);
            setSelectedSize(inStock ? inStock.size : forColor[0]?.size ?? selectedSize);
        }
    }, [initialColor]);

    const fetchWishlistStatus = async () => {
        try {
            const res = await fetch("/api/wishlist");
            if (res.ok) {
                const data = await res.json();
                setIsWishlisted(data.some((item: any) => item.productId === product.id));
            }
        } catch (error) {
            console.error("Error fetching wishlist:", error);
        }
    };

    const toggleWishlist = async () => {
        if (!session) {
            toast.error("Please login to save items");
            router.push(`/login?callbackUrl=/product/${product.slug}`);
            return;
        }

        setWishlistLoading(true);
        try {
            const res = await fetch("/api/wishlist", {
                method: "POST",
                body: JSON.stringify({ productId: product.id }),
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                const data = await res.json();
                setIsWishlisted(data.added);
                toast.success(data.message);
            } else {
                toast.error("Failed to update wishlist");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!session) {
            toast.error("Please login to add to bag");
            router.push(`/login?callbackUrl=/product/${product.slug}`);
            return;
        }

        const variant = product.variants.find((v: any) => v.color === selectedColor && v.size === selectedSize);
        if (!variant) {
            toast.error("Selected variant not found");
            return;
        }
        const stock = variant.stock ?? 0;
        if (stock <= 0) {
            toast.error("This size is out of stock");
            return;
        }

        setIsAddingToCart(true);
        try {
            await addToCart(product.id, variant.id, 1);
        } finally {
            setIsAddingToCart(false);
        }
    };

    const colors = Array.from(new Set(product.variants.map((v: any) => v.color)));

    // Filter images by selected color
    const currentColorImages = product.images.filter((img: any) => img.color === selectedColor);
    // Include images that have no color assigned as "General" images
    const generalImages = product.images.filter((img: any) => !img.color || img.color === "");

    // Display color-specific images + general images
    const displayImages = currentColorImages.length > 0 ? [...currentColorImages, ...generalImages] : product.images;

    // Sizes for selected color with stock (variant has stock)
    const sizeVariants = product.variants.filter((v: any) => v.color === selectedColor);
    const sizesWithStock = sizeVariants.map((v: any) => ({
        size: v.size,
        stock: v.stock ?? 0,
        variantId: v.id,
    }));

    const selectedVariant = product.variants.find(
        (v: any) => v.color === selectedColor && v.size === selectedSize
    );
    const selectedStock = selectedVariant?.stock ?? 0;
    const isSelectedSizeOutOfStock = selectedStock <= 0;

    const currentPrice = selectedVariant?.price ?? product.variants[0]?.price;
    const actualPrice = selectedVariant?.actualPrice ?? product.variants[0]?.actualPrice;
    const hasDiscount = actualPrice != null && Number(actualPrice) > 0 && Number(currentPrice) < Number(actualPrice);
    const discountPercent = hasDiscount
        ? Math.round((1 - Number(currentPrice) / Number(actualPrice)) * 100)
        : 0;

    const handleColorChange = (color: string) => {
        setSelectedColor(color);
        setSelectedImage(0);
        const forColor = product.variants.filter((v: any) => v.color === color);
        const inStock = forColor.find((v: any) => (v.stock ?? 0) > 0);
        setSelectedSize(inStock ? inStock.size : forColor[0]?.size ?? selectedSize);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 font-sans">
            {/* Breadcrumbs */}
            <nav className="flex text-xs text-neutral/60 mb-8 space-x-2">
                <span>Home</span> <span>/</span>
                <span className="capitalize">{product.category.parentId ? "Wear" : product.category.name}</span> <span>/</span>
                <span className="font-bold text-primary">{product.name}</span>
            </nav>

            <div className="flex flex-col lg:flex-row gap-10">
                {/* Left: Thumbnails */}
                <div className="hidden lg:flex flex-col gap-3 w-20">
                    {displayImages.map((img: any, i: number) => (
                        <button
                            key={i}
                            onClick={() => setSelectedImage(i)}
                            className={`aspect-3/4 border-2 transition overflow-hidden rounded-sm ${selectedImage === i ? "border-primary" : "border-transparent"}`}
                        >
                            <Image
                                width="0"
                                height="0"
                                sizes="100vw"
                                alt={product.name}
                                src={convertDriveLink(img.driveUrl)}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>

                {/* Center: Main Image (Reveal Wave only for CORS-friendly URLs; Drive uses Image) */}
                <div className="flex-1 relative group bg-neutral/5 rounded-sm overflow-hidden aspect-3/4">
                    {(() => {
                        const imageSrc = displayImages[selectedImage]?.driveUrl
                            ? convertDriveLink(displayImages[selectedImage].driveUrl)
                            : convertDriveLink(displayImages[0]?.driveUrl ?? "");
                        const isDriveOrCorsBlocked = /google\.com|drive\.|usercontent\.google/.test(imageSrc);
                        if (imageSrc && !isDriveOrCorsBlocked) {
                            return (
                                <RevealWaveImage
                                    src={imageSrc}
                                    className="absolute inset-0 z-0 w-full h-full"
                                    waveSpeed={0.25}
                                    waveFrequency={1.5}
                                    waveAmplitude={0.12}
                                    revealRadius={0.4}
                                    revealSoftness={0.6}
                                    pixelSize={2}
                                    mouseRadius={0.3}
                                />
                            );
                        }
                        return imageSrc ? (
                            <Image
                                className="z-10 w-full h-full object-cover"
                                src={imageSrc}
                                alt={product.name}
                                referrerPolicy="no-referrer"
                                width={0}
                                height={0}
                                sizes="100vw"
                            />
                        ) : (
                            <div className="absolute inset-0 z-0 bg-neutral/10" />
                        );
                    })()}

                    {/* Navigation Arrows */}
                    <button
                        onClick={() => setSelectedImage(prev => (prev > 0 ? prev - 1 : displayImages.length - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setSelectedImage(prev => (prev < displayImages.length - 1 ? prev + 1 : 0))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-[10px] text-secondary/60 bg-white/90 px-3 py-1 rounded-full border border-neutral/10 font-bold uppercase tracking-widest italic">
                        Premium Quality Assured
                    </div>
                </div>

                {/* Right: Product Info */}
                <div className="lg:w-[450px] space-y-8">
                    <div className="space-y-3">
                        <h1 className="text-2xl font-semibold text-primary">{product.name}</h1>
                        <p className="text-secondary/60 text-sm leading-relaxed">{product.description}</p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                            {hasDiscount && (
                                <>
                                    <span className="text-lg text-secondary/70 line-through">₹{Math.round(Number(actualPrice))}</span>
                                    <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-600 text-xs font-bold uppercase">
                                        {discountPercent}% off
                                    </span>
                                </>
                            )}
                            <span className="text-2xl font-bold text-primary">
                                {hasDiscount ? `₹${Math.round(Number(currentPrice))}` : `MRP ₹${Math.round(Number(currentPrice))}`}
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Inclusive of all taxes</p>
                    </div>

                    {/* Color Selection */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-secondary/80">
                            <span>Select Color</span>
                            <span className="text-primary bg-primary/10 px-2 py-0.5 rounded">{getColorDisplayName(selectedColor)}</span>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {colors.map((color: any) => (
                                <button
                                    key={color}
                                    onClick={() => handleColorChange(color)}
                                    className={`relative w-10 h-10 rounded-full border-2 p-0.5 transition-all duration-300 hover:scale-110 ${selectedColor === color ? "border-primary scale-110" : "border-neutral/20"}`}
                                >
                                    <div
                                        className="w-full h-full rounded-full shadow-inner border border-black/10"
                                        style={{ backgroundColor: getColorSwatchValue(color) }}
                                        title={getColorDisplayName(color)}
                                    />
                                    {selectedColor === color && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Size Selection */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-secondary/80">
                            <span>Select Size</span>
                            <button className="text-primary hover:underline flex items-center gap-1 group">
                                <Ruler className="w-3.5 h-3.5" />
                                Size Chart
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {sizesWithStock.map(({ size, stock }) => {
                                const outOfStock = stock <= 0;
                                return (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => !outOfStock && setSelectedSize(size)}
                                        disabled={outOfStock}
                                        className={`min-w-12 h-12 px-4 rounded-full border flex flex-col items-center justify-center text-sm font-bold transition-all duration-200 ${
                                            outOfStock
                                                ? "border-neutral/20 bg-neutral/5 text-secondary/50 cursor-not-allowed line-through"
                                                : selectedSize === size
                                                    ? "border-primary bg-[#1a1a1a] text-white shadow-lg scale-105"
                                                    : "border-neutral/30 hover:border-primary text-secondary/80"
                                        }`}
                                        title={outOfStock ? "Out of stock" : undefined}
                                    >
                                        <span>{size}</span>
                                        {outOfStock && (
                                            <span className="text-[10px] font-normal normal-case opacity-80">Out of stock</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {sizesWithStock.length === 0 && (
                            <p className="text-xs text-red-500 font-medium italic">No sizes available for the selected color.</p>
                        )}
                        {isSelectedSizeOutOfStock && selectedSize && (
                            <p className="text-sm text-amber-600 font-medium">This size is currently out of stock. Choose another size.</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Button
                            className="w-full h-14 bg-[#1a1a1a] hover:bg-black text-white text-md font-bold rounded-sm gap-3"
                            onClick={handleAddToCart}
                            disabled={isAddingToCart || isSelectedSizeOutOfStock}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            {isAddingToCart ? "ADDING..." : isSelectedSizeOutOfStock ? "OUT OF STOCK" : "ADD TO BAG"}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-14 border-neutral/30 text-primary text-md font-bold rounded-sm gap-3 hover:bg-neutral/5 transition-all"
                            onClick={toggleWishlist}
                            disabled={wishlistLoading}
                        >
                            <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                            {isWishlisted ? "WISHLISTED" : "SAVE TO WISHLIST"}
                        </Button>
                    </div>

                    {/* Additional Details */}
                    <div className="pt-8 space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-primary pb-2 border-b border-neutral/10">Product Details</h3>
                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                            <div className="text-secondary/60">Primary Color:</div>
                            <div className="font-medium text-primary uppercase">{selectedColor}</div>

                            <div className="text-secondary/60">Category:</div>
                            <div className="font-medium text-primary">{product.category.name}</div>

                            <div className="text-secondary/60">Package Contains:</div>
                            <div className="font-medium text-primary">1 {product.name}</div>

                            <div className="text-secondary/60">Wash Care:</div>
                            <div className="font-medium text-primary italic">Machine wash warm</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
