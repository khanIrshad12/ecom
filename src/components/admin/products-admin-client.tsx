"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDrivePreviewUrl } from "@/lib/utils-drive";
import { getColorSwatchValue, PALETTE_COLORS } from "@/lib/utils-color";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronDown } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  path?: string;
  level?: number;
};

type ProductImage = { driveUrl: string; color?: string | null; displayOrder?: number };
type ProductVariant = {
  color: string;
  size: string;
  stock: number | string;
  price: number | string;
  actualPrice?: number | string | null;
};

type ColorGroup = {
  color: string;
  driveUrls: string[];
  sizes: Array<{
    size: string;
    stock: number | string;
    price: number | string;
    actualPrice?: number | string;
    discountPercent?: number | string;
  }>;
};

type Brand = { id: string; name: string; slug: string };

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  category?: { id: string; name: string };
  brandId?: string | null;
  brand?: Brand | null;
  isTrending?: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
};

function emptyColorGroup(): ColorGroup {
  return {
    color: "#000000",
    driveUrls: ["", "", ""],
    sizes: [{ size: "M", stock: 0, price: 0 }],
  };
}

function emptySizeOption() {
  return { size: "M", stock: 0, price: 0, actualPrice: "", discountPercent: "" };
}

function calcDiscountedPrice(actualPrice: number, discountPercent: number): number {
  if (discountPercent <= 0) return Math.round(actualPrice);
  return Math.round(actualPrice * (1 - discountPercent / 100));
}

function sortableImageId(colorIdx: number, imgIdx: number) {
  return `img-${colorIdx}-${imgIdx}`;
}

/** Color combobox: suggestions from existing catalog colors + palette, with swatches. Allows custom value. */
function ColorCombobox({
  value,
  onChange,
  existingColors,
  onBlur,
}: {
  value: string;
  onChange: (value: string) => void;
  existingColors: string[];
  onBlur?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const q = inputValue.trim().toLowerCase();
  const existingFiltered = existingColors.filter(
    (c) => c.toLowerCase().includes(q) || getColorSwatchValue(c).toLowerCase().includes(q)
  );
  const paletteFiltered = PALETTE_COLORS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.hex.toLowerCase().includes(q)
  );
  const hasSuggestions = existingFiltered.length > 0 || paletteFiltered.length > 0;

  const pick = (val: string) => {
    onChange(val);
    setInputValue(val);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative max-w-xs">
      <Input
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => onBlur?.()}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="#000000 or Black"
        className="pr-8"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setOpen((o) => !o)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label="Toggle suggestions"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-input bg-popover shadow-md">
          {hasSuggestions ? (
            <>
              {existingFiltered.length > 0 && (
                <div className="p-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1">In catalog</p>
                  {existingFiltered.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => pick(c)}
                    >
                      <span
                        className="h-5 w-5 shrink-0 rounded-full border border-neutral/20"
                        style={{ backgroundColor: getColorSwatchValue(c) }}
                      />
                      <span className="truncate">{c}</span>
                    </button>
                  ))}
                </div>
              )}
              {paletteFiltered.length > 0 && (
                <div className="p-1.5 border-t border-border">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1">Palette</p>
                  {paletteFiltered.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => pick(p.name)}
                    >
                      <span
                        className="h-5 w-5 shrink-0 rounded-full border border-neutral/20"
                        style={{ backgroundColor: p.hex }}
                      />
                      <span className="truncate capitalize">{p.name}</span>
                      <span className="text-muted-foreground text-xs ml-auto">{p.hex}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="px-3 py-4 text-sm text-muted-foreground">Type to search or enter a custom color (name or hex)</p>
          )}
        </div>
      )}
    </div>
  );
}

function SortableImageRow({
  id,
  url,
  previewKey,
  failed,
  onUrlChange,
  onRemove,
  onPreviewError,
  canRemove,
}: {
  id: string;
  url: string;
  previewKey: string;
  failed: boolean;
  onUrlChange: (value: string) => void;
  onRemove: () => void;
  onPreviewError?: () => void;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const previewUrl = url.trim();
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-2 items-center rounded-md border p-2 transition-opacity ${isDragging ? "opacity-60 bg-muted/50 z-10" : "bg-background"}`}
    >
      <button
        type="button"
        className="shrink-0 touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 rounded"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="shrink-0 w-16 h-16 rounded-md border border-neutral/20 bg-muted/50 overflow-hidden flex items-center justify-center">
        {!previewUrl ? (
          <span className="text-[10px] text-muted-foreground text-center px-1">Paste link</span>
        ) : failed ? (
          <span className="text-[10px] text-muted-foreground text-center px-1">Couldn&apos;t load</span>
        ) : (
          <img
            src={getDrivePreviewUrl(previewUrl)}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={() => onPreviewError?.()}
          />
        )}
      </div>
      <Input
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="https://drive.google.com/..."
        className="flex-1 min-w-0"
      />
      <Button variant="outline" type="button" disabled={!canRemove} onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}

export default function ProductsAdminClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [isTrending, setIsTrending] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>([emptyColorGroup()]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [failedPreviews, setFailedPreviews] = useState<Set<string>>(new Set());
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const editingProduct = useMemo(
    () => (editingId ? products.find((p) => p.id === editingId) : undefined),
    [editingId, products]
  );

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, bRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
        fetch("/api/brands?activeOnly=true"),
      ]);
      const [pData, cData, bData] = await Promise.all([pRes.json(), cRes.json(), bRes.json()]);
      setProducts(Array.isArray(pData) ? pData : []);
      setCategories(Array.isArray(cData?.flat) ? cData.flat : Array.isArray(cData) ? cData : []);
      setBrands(Array.isArray(bData) ? bData : []);
    } catch {
      toast.error("Failed to load admin data");
      setProducts([]);
      setCategories([]);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const leafCategoryIds = useMemo(() => {
    // leaf = category that is not a parent of any other category
    const parentIds = new Set(categories.map((c) => c.parentId).filter(Boolean) as string[]);
    const leafIds = new Set(categories.filter((c) => !parentIds.has(c.id)).map((c) => c.id));
    return leafIds;
  }, [categories]);

  const categoriesById = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const existingCatalogColors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) =>
      p.variants?.forEach((v) => {
        const c = (v as { color?: string }).color?.trim();
        if (c) set.add(c);
      })
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const categoryOptions = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    const sorted = [...categories].sort((a, b) => {
      const ap = (a.path || `/${a.slug}`).toLowerCase();
      const bp = (b.path || `/${b.slug}`).toLowerCase();
      return ap.localeCompare(bp);
    });

    const filtered = q
      ? sorted.filter((c) => {
          const label = `${c.path || `/${c.slug}`} ${c.name}`.toLowerCase();
          return label.includes(q);
        })
      : sorted;

    // Prefer leaf categories first (still allow selecting non-leaf if needed)
    return filtered.sort((a, b) => {
      const aLeaf = leafCategoryIds.has(a.id) ? 0 : 1;
      const bLeaf = leafCategoryIds.has(b.id) ? 0 : 1;
      if (aLeaf !== bLeaf) return aLeaf - bLeaf;
      const ap = (a.path || `/${a.slug}`).toLowerCase();
      const bp = (b.path || `/${b.slug}`).toLowerCase();
      return ap.localeCompare(bp);
    });
  }, [categories, categorySearch, leafCategoryIds]);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!editingProduct) return;
    setFailedPreviews(new Set());
    setName(editingProduct.name || "");
    setDescription(editingProduct.description || "");
    setCategoryId(editingProduct.categoryId || "");
    setBrandId(editingProduct.brandId ?? "");
    setIsTrending(editingProduct.isTrending ?? false);

    // Group variants by color
    if (editingProduct.variants?.length) {
      const grouped = new Map<string, ColorGroup>();

      editingProduct.variants.forEach((v) => {
        const colorKey = (v.color || "").toLowerCase();
        if (!grouped.has(colorKey)) {
          // Get images for this color
          const imagesForColor =
            editingProduct.images?.filter(
              (img) => (img.color || "").toLowerCase() === colorKey
            ) || [];
          const sorted = [...imagesForColor].sort(
            (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
          );
          const urls = sorted.map((img) => img.driveUrl).slice(0, 6);
          while (urls.length < 3) urls.push("");

          grouped.set(colorKey, {
            color: v.color,
            driveUrls: urls,
            sizes: [],
          });
        }

        const group = grouped.get(colorKey)!;
        const ap = (v as any).actualPrice;
        const p = v.price;
        const discountPct =
          ap != null && Number(ap) > 0 && p != null
            ? Math.round((1 - Number(p) / Number(ap)) * 100)
            : "";
        group.sizes.push({
          size: v.size,
          stock: (v as any).stock ?? 0,
          price: v.price,
          actualPrice: ap ?? "",
          discountPercent: discountPct,
        });
      });

      setColorGroups(Array.from(grouped.values()));
    } else {
      setColorGroups([emptyColorGroup()]);
    }
  }, [editingProduct]);

  const handleAddColorGroup = () => setColorGroups((prev) => [...prev, emptyColorGroup()]);
  const handleRemoveColorGroup = (idx: number) =>
    setColorGroups((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));

  const handleAddSizeToColor = (colorIdx: number) => {
    setColorGroups((prev) =>
      prev.map((group, i) =>
        i === colorIdx ? { ...group, sizes: [...group.sizes, emptySizeOption()] } : group
      )
    );
  };

  const handleRemoveSizeFromColor = (colorIdx: number, sizeIdx: number) => {
    setColorGroups((prev) =>
      prev.map((group, i) =>
        i === colorIdx
          ? {
              ...group,
              sizes: group.sizes.length > 1 ? group.sizes.filter((_, j) => j !== sizeIdx) : group.sizes,
            }
          : group
      )
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setCategoryId("");
    setBrandId("");
    setIsTrending(false);
    setCategorySearch("");
    setColorGroups([emptyColorGroup()]);
    setFailedPreviews(new Set());
  };

  const validate = () => {
    if (!name.trim()) return "Product name is required";
    if (!description.trim()) return "Description is required";
    if (!categoryId) return "Category is required";
    if (!colorGroups.length) return "At least one color variant is required";
    if (colorGroups.some((g) => !String(g.color).trim())) return "All color variants must have a color";
    if (colorGroups.some((g) => !g.sizes.length)) return "Each color must have at least one size";
    if (
      colorGroups.some((g) =>
        g.sizes.some((s) => !String(s.size).trim() || Number(s.price) <= 0)
      )
    ) {
      return "All sizes must have a size value and price > 0";
    }
    if (
      colorGroups.some((g) => {
        const filled = g.driveUrls.map((u) => u.trim()).filter(Boolean);
        return filled.length < 3 || filled.length > 6;
      })
    ) {
      return "Each color must have between 3 and 6 image URLs";
    }
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      // Flatten color groups back to variants and images
      const variantsPayload: ProductVariant[] = colorGroups.flatMap((group) =>
        group.sizes.map((size) => {
          const actualPriceNum = size.actualPrice ? Number(size.actualPrice) : null;
          const discountPctNum = size.discountPercent ? Number(size.discountPercent) : null;
          let priceNum = Number(size.price);
          if (actualPriceNum != null && actualPriceNum > 0 && discountPctNum != null && discountPctNum > 0) {
            priceNum = calcDiscountedPrice(actualPriceNum, discountPctNum);
          }
          return {
            color: String(group.color).trim(),
            size: String(size.size).trim(),
            stock: Number(size.stock || 0),
            price: Math.round(priceNum),
            actualPrice: actualPriceNum != null && actualPriceNum > 0 ? Math.round(actualPriceNum) : null,
          };
        })
      );

      const imagesPayload: ProductImage[] = colorGroups.flatMap((group) =>
        group.driveUrls
          .map((url) => url.trim())
          .filter(Boolean)
          .map((url, imgIdx) => ({
            driveUrl: url,
            color: group.color?.toString().trim() || null,
            displayOrder: imgIdx,
          }))
      );

      const payload = {
        name: name.trim(),
        description: description.trim(),
        categoryId,
        brandId: brandId || null,
        isTrending,
        variants: variantsPayload,
        images: imagesPayload,
      };

      const res = await fetch(editingId ? `/api/products/${editingId}` : "/api/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to save product");
        return;
      }
      toast.success(editingId ? "Product updated" : "Product created");
      await fetchAll();
      resetForm();
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const performDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to delete product");
        setDeleteConfirmProduct(null);
        return;
      }
      toast.success("Product deleted");
      setDeleteConfirmProduct(null);
      if (editingId === id) resetForm();
      await fetchAll();
    } catch {
      toast.error("Failed to delete product");
      setDeleteConfirmProduct(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <AlertDialog
        open={!!deleteConfirmProduct}
        onOpenChange={(open) => !open && setDeleteConfirmProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmProduct && (
                <>
                  &ldquo;{deleteConfirmProduct.name}&rdquo; will be permanently deleted. This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                if (deleteConfirmProduct) performDelete(deleteConfirmProduct.id);
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Products</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAll} disabled={loading}>
            Refresh
          </Button>
          <Button variant="outline" onClick={resetForm} disabled={saving}>
            New Product
          </Button>
        </div>
      </div>

      <Card className="border-neutral/20">
        <CardHeader>
          <h2 className="text-lg font-bold text-primary">{editingId ? "Edit Product" : "Create Product"}</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-category">Category</Label>
              <Input
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search categories (e.g. mens wear / t-shirts / full sleeve)"
              />
              <select
                id="p-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 w-full rounded-md border border-neutral/20 bg-background px-3 text-sm"
              >
                <option value="">Select category</option>
                {categoryOptions.map((c) => {
                  const base = (c.path || `/${c.slug}`) + " — " + c.name;
                  const parentLabel = c.parentId ? categoriesById.get(c.parentId)?.name : null;
                  const suffix = parentLabel ? ` — ${parentLabel}` : leafCategoryIds.has(c.id) ? "" : " (parent)";
                  return (
                    <option key={c.id} value={c.id}>
                      {base + suffix}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-brand">Brand (optional)</Label>
              <select
                id="p-brand"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="h-10 w-full rounded-md border border-neutral/20 bg-background px-3 text-sm"
              >
                <option value="">None</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTrending}
                  onChange={(e) => setIsTrending(e.target.checked)}
                  className="rounded border-input"
                />
                <span className="text-sm font-medium">Trending</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-desc">Description</Label>
            <textarea
              id="p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-28 w-full rounded-md border border-neutral/20 bg-background px-3 py-2 text-sm"
              placeholder="Product description"
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-primary">Color Variants</h3>
              <div className="flex gap-2">
                {colorGroups.length >= 2 && (
                  <Button
                    variant="outline"
                    type="button"
                    disabled={colorGroups[0].sizes.length === 0}
                    onClick={() =>
                      setColorGroups((prev) =>
                        prev.map((g, i) => (i === 0 ? g : { ...g, sizes: prev[0].sizes.map((s) => ({ ...s })) }))
                      )
                    }
                    title="Copy size rows (size, stock, price, actualPrice, discount%) from first color to all other colors. Each field remains editable."
                  >
                    Copy sizes from first color to all
                  </Button>
                )}
                <Button variant="outline" onClick={handleAddColorGroup} type="button">
                  Add Color Variant
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {colorGroups.map((group, colorIdx) => (
                <div key={colorIdx} className="space-y-4 border border-neutral/10 rounded-md p-4 bg-neutral/5">
                  {/* Color Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-neutral/10">
                    <div className="space-y-2 flex-1">
                      <Label>Color</Label>
                      <ColorCombobox
                        value={String(group.color)}
                        onChange={(val) =>
                          setColorGroups((prev) =>
                            prev.map((g, i) => (i === colorIdx ? { ...g, color: val } : g))
                          )
                        }
                        existingColors={existingCatalogColors}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleRemoveColorGroup(colorIdx)}
                      type="button"
                      className="ml-4"
                    >
                      Remove Color
                    </Button>
                  </div>

                  {/* Images Section - Shared across all sizes of this color (drag to reorder) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Images for this color (3–6) - Drag to reorder</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        disabled={group.driveUrls.length >= 6}
                        onClick={() =>
                          setColorGroups((prev) =>
                            prev.map((g, i) =>
                              i === colorIdx ? { ...g, driveUrls: [...g.driveUrls, ""] } : g
                            )
                          )
                        }
                      >
                        Add Image
                      </Button>
                    </div>
                    <DndContext
                      sensors={dndSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event: DragEndEvent) => {
                        const { active, over } = event;
                        if (!over || active.id === over.id) return;
                        const activeId = String(active.id);
                        const overId = String(over.id);
                        if (!activeId.startsWith("img-") || !overId.startsWith("img-")) return;
                        const [, cIdxStr, activeIdxStr] = activeId.split("-");
                        const [, , overIdxStr] = overId.split("-");
                        const cIdx = parseInt(cIdxStr, 10);
                        const oldIndex = parseInt(activeIdxStr, 10);
                        const newIndex = parseInt(overIdxStr, 10);
                        if (cIdx !== colorIdx || isNaN(oldIndex) || isNaN(newIndex)) return;
                        setColorGroups((prev) =>
                          prev.map((g, i) =>
                            i === colorIdx
                              ? { ...g, driveUrls: arrayMove(g.driveUrls, oldIndex, newIndex) }
                              : g
                          )
                        );
                      }}
                    >
                      <SortableContext
                        items={group.driveUrls.map((_, imgIdx) => sortableImageId(colorIdx, imgIdx))}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {group.driveUrls.map((url, imgIdx) => {
                            const previewKey = `${colorIdx}-${imgIdx}`;
                            const failed = failedPreviews.has(previewKey);
                            return (
                              <SortableImageRow
                                key={sortableImageId(colorIdx, imgIdx)}
                                id={sortableImageId(colorIdx, imgIdx)}
                                url={url}
                                previewKey={previewKey}
                                failed={failed}
                                onUrlChange={(value) => {
                                  setFailedPreviews((prev) => {
                                    const next = new Set(prev);
                                    next.delete(previewKey);
                                    return next;
                                  });
                                  setColorGroups((prev) =>
                                    prev.map((g, i) =>
                                      i === colorIdx
                                        ? {
                                            ...g,
                                            driveUrls: g.driveUrls.map((u, j) =>
                                              j === imgIdx ? value : u
                                            ),
                                          }
                                        : g
                                    )
                                  );
                                }}
                                onRemove={() =>
                                  setColorGroups((prev) =>
                                    prev.map((g, i) =>
                                      i === colorIdx
                                        ? {
                                            ...g,
                                            driveUrls: g.driveUrls.filter((_, j) => j !== imgIdx),
                                          }
                                        : g
                                    )
                                  )
                                }
                                onPreviewError={() =>
                                  setFailedPreviews((prev) => new Set(prev).add(previewKey))
                                }
                                canRemove={group.driveUrls.length > 3}
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>

                  {/* Sizes Section - Multiple sizes per color */}
                  <div className="space-y-3 pt-2 border-t border-neutral/10">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold">Sizes for this color</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => handleAddSizeToColor(colorIdx)}
                      >
                        Add Size
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {group.sizes.map((size, sizeIdx) => {
                        const actualNum = size.actualPrice ? Number(size.actualPrice) : 0;
                        const pctNum = size.discountPercent ? Number(size.discountPercent) : 0;
                        const updateSize = (updates: Partial<typeof size>) =>
                          setColorGroups((prev) =>
                            prev.map((g, i) =>
                              i === colorIdx
                                ? {
                                    ...g,
                                    sizes: g.sizes.map((s, j) =>
                                      j === sizeIdx ? { ...s, ...updates } : s
                                    ),
                                  }
                                : g
                            )
                          );
                        const onActualOrPctChange = (
                          newActual?: number | string,
                          newPct?: number | string
                        ) => {
                          const a = newActual !== undefined ? (newActual === "" ? 0 : Number(newActual)) : actualNum;
                          const p = newPct !== undefined ? (newPct === "" ? 0 : Number(newPct)) : pctNum;
                          const updates: Partial<typeof size> = {};
                          if (newActual !== undefined) updates.actualPrice = newActual;
                          if (newPct !== undefined) updates.discountPercent = newPct;
                          if (a > 0 && p > 0) {
                            updates.price = calcDiscountedPrice(a, p);
                          } else if (newActual !== undefined && a > 0 && Number(size.price) > 0 && Number(size.price) < a) {
                            updates.discountPercent = Math.round((1 - Number(size.price) / a) * 100);
                          }
                          updateSize(updates);
                        };
                        const onSellingPriceChange = (newPrice: string) => {
                          const num = newPrice === "" ? 0 : Number(newPrice);
                          const updates: Partial<typeof size> = { price: newPrice === "" ? 0 : num };
                          if (actualNum > 0 && num > 0 && num < actualNum) {
                            updates.discountPercent = Math.round((1 - num / actualNum) * 100);
                          } else if (actualNum > 0 && (num >= actualNum || num === 0)) {
                            updates.discountPercent = "";
                          }
                          updateSize(updates);
                        };
                        return (
                          <div
                            key={sizeIdx}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 p-3 bg-background rounded-md border border-neutral/10"
                          >
                            <div className="space-y-1">
                              <Label className="text-xs">Size</Label>
                              <Input
                                value={String(size.size)}
                                onChange={(e) => updateSize({ size: e.target.value })}
                                placeholder="M"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Stock</Label>
                              <Input
                                value={String(size.stock)}
                                onChange={(e) => updateSize({ stock: e.target.value })}
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Actual (MRP)</Label>
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                value={size.actualPrice === "" || size.actualPrice == null ? "" : size.actualPrice}
                                onChange={(e) => onActualOrPctChange(e.target.value, undefined)}
                                placeholder="999"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Discount %</Label>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={1}
                                value={size.discountPercent === "" || size.discountPercent == null ? "" : size.discountPercent}
                                onChange={(e) => onActualOrPctChange(undefined, e.target.value)}
                                placeholder="20"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Selling price</Label>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={String(size.price)}
                                onChange={(e) => onSellingPriceChange(e.target.value)}
                                placeholder="799"
                                title="Auto-fills Discount % when Actual price is set; or set Discount % to auto-calc this"
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                variant="outline"
                                type="button"
                                disabled={group.sizes.length <= 1}
                                onClick={() => handleRemoveSizeFromColor(colorIdx, sizeIdx)}
                                className="w-full"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {editingId && (
              <Button variant="outline" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-neutral/20">
        <CardHeader>
          <h2 className="text-lg font-bold text-primary">All Products</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-secondary">Loading...</p>
          ) : products.length === 0 ? (
            <p className="text-secondary">No products found.</p>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="border border-neutral/10 rounded-md p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-primary truncate">{p.name}</p>
                      <p className="text-xs text-secondary/60 truncate">{p.slug}</p>
                      <p className="text-xs text-secondary mt-1">
                        Category: <span className="font-medium text-primary">{p.category?.name || p.categoryId}</span>
                      </p>
                      {p.brand && (
                        <p className="text-xs text-secondary mt-1">
                          Brand: <span className="font-medium text-primary">{p.brand.name}</span>
                        </p>
                      )}
                      {p.isTrending && (
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">
                          Trending
                        </span>
                      )}
                      <p className="text-xs text-secondary mt-1">
                        Variants: <span className="font-medium text-primary">{p.variants?.length || 0}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setEditingId(p.id)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          setDeleteConfirmProduct({ id: p.id, name: p.name })
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

