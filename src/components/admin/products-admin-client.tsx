"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
};

type ProductImage = { driveUrl: string; color?: string | null };
type ProductVariant = {
  color: string;
  size: string;
  stock: number | string;
  price: number | string;
};

type ColorGroup = {
  color: string;
  driveUrls: string[]; // 3–6 image URLs shared across all sizes of this color
  sizes: Array<{
    size: string;
    stock: number | string;
    price: number | string;
  }>;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  category?: { id: string; name: string };
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
  return { size: "M", stock: 0, price: 0 };
}

export default function ProductsAdminClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>([emptyColorGroup()]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const editingProduct = useMemo(
    () => (editingId ? products.find((p) => p.id === editingId) : undefined),
    [editingId, products]
  );

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([fetch("/api/products"), fetch("/api/categories")]);
      const [pData, cData] = await Promise.all([pRes.json(), cRes.json()]);
      setProducts(Array.isArray(pData) ? pData : []);
      setCategories(Array.isArray(cData) ? cData : []);
    } catch {
      toast.error("Failed to load admin data");
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!editingProduct) return;
    setName(editingProduct.name || "");
    setDescription(editingProduct.description || "");
    setCategoryId(editingProduct.categoryId || "");

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
          const urls = imagesForColor.map((img) => img.driveUrl).slice(0, 6);
          while (urls.length < 3) urls.push("");

          grouped.set(colorKey, {
            color: v.color,
            driveUrls: urls,
            sizes: [],
          });
        }

        const group = grouped.get(colorKey)!;
        group.sizes.push({
          size: v.size,
          stock: (v as any).stock ?? 0,
          price: v.price,
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
    setColorGroups([emptyColorGroup()]);
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
        group.sizes.map((size) => ({
          color: String(group.color).trim(),
          size: String(size.size).trim(),
          stock: Number(size.stock || 0),
          price: Number(size.price),
        }))
      );

      const imagesPayload: ProductImage[] = colorGroups.flatMap((group) =>
        group.driveUrls
          .map((url) => url.trim())
          .filter(Boolean)
          .map((url) => ({
            driveUrl: url,
            color: group.color?.toString().trim() || null,
          }))
      );

      const payload = {
        name: name.trim(),
        description: description.trim(),
        categoryId,
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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to delete product");
        return;
      }
      toast.success("Product deleted");
      if (editingId === id) resetForm();
      await fetchAll();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="space-y-8">
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
              <select
                id="p-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 w-full rounded-md border border-neutral/20 bg-background px-3 text-sm"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-primary">Color Variants</h3>
              <Button variant="outline" onClick={handleAddColorGroup} type="button">
                Add Color Variant
              </Button>
            </div>
            <div className="space-y-4">
              {colorGroups.map((group, colorIdx) => (
                <div key={colorIdx} className="space-y-4 border border-neutral/10 rounded-md p-4 bg-neutral/5">
                  {/* Color Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-neutral/10">
                    <div className="space-y-2 flex-1">
                      <Label>Color</Label>
                      <Input
                        value={String(group.color)}
                        onChange={(e) =>
                          setColorGroups((prev) =>
                            prev.map((g, i) => (i === colorIdx ? { ...g, color: e.target.value } : g))
                          )
                        }
                        placeholder="#000000 or Black"
                        className="max-w-xs"
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

                  {/* Images Section - Shared across all sizes of this color */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Images for this color (3–6) - Shared across all sizes</Label>
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
                    <div className="space-y-2">
                      {group.driveUrls.map((url, imgIdx) => (
                        <div key={imgIdx} className="flex gap-2">
                          <Input
                            value={url}
                            onChange={(e) =>
                              setColorGroups((prev) =>
                                prev.map((g, i) =>
                                  i === colorIdx
                                    ? {
                                        ...g,
                                        driveUrls: g.driveUrls.map((u, j) =>
                                          j === imgIdx ? e.target.value : u
                                        ),
                                      }
                                    : g
                                )
                              )
                            }
                            placeholder="https://drive.google.com/..."
                          />
                          <Button
                            variant="outline"
                            type="button"
                            disabled={group.driveUrls.length <= 3}
                            onClick={() =>
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
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
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
                      {group.sizes.map((size, sizeIdx) => (
                        <div
                          key={sizeIdx}
                          className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-background rounded-md border border-neutral/10"
                        >
                          <div className="space-y-2">
                            <Label>Size</Label>
                            <Input
                              value={String(size.size)}
                              onChange={(e) =>
                                setColorGroups((prev) =>
                                  prev.map((g, i) =>
                                    i === colorIdx
                                      ? {
                                          ...g,
                                          sizes: g.sizes.map((s, j) =>
                                            j === sizeIdx ? { ...s, size: e.target.value } : s
                                          ),
                                        }
                                      : g
                                  )
                                )
                              }
                              placeholder="M"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Stock</Label>
                            <Input
                              value={String(size.stock)}
                              onChange={(e) =>
                                setColorGroups((prev) =>
                                  prev.map((g, i) =>
                                    i === colorIdx
                                      ? {
                                          ...g,
                                          sizes: g.sizes.map((s, j) =>
                                            j === sizeIdx ? { ...s, stock: e.target.value } : s
                                          ),
                                        }
                                      : g
                                  )
                                )
                              }
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Price</Label>
                            <Input
                              value={String(size.price)}
                              onChange={(e) =>
                                setColorGroups((prev) =>
                                  prev.map((g, i) =>
                                    i === colorIdx
                                      ? {
                                          ...g,
                                          sizes: g.sizes.map((s, j) =>
                                            j === sizeIdx ? { ...s, price: e.target.value } : s
                                          ),
                                        }
                                      : g
                                  )
                                )
                              }
                              placeholder="499"
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
                              Remove Size
                            </Button>
                          </div>
                        </div>
                      ))}
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
                      <p className="text-xs text-secondary mt-1">
                        Variants: <span className="font-medium text-primary">{p.variants?.length || 0}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setEditingId(p.id)}>
                        Edit
                      </Button>
                      <Button variant="destructive" onClick={() => handleDelete(p.id)}>
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

