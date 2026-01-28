"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  parentId?: string | null;
  subCategories?: Category[];
};

export default function CategoriesAdminClient() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const parentOptions = useMemo(() => categories.filter((c) => !c.parentId), [categories]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          parentId: parentId || null,
          imageUrl: imageUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to create category");
        return;
      }
      toast.success("Category created");
      setName("");
      setParentId("");
      setImageUrl("");
      await fetchCategories();
    } catch {
      toast.error("Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? (Subcategories will also be deleted)")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to delete category");
        return;
      }
      toast.success("Category deleted");
      await fetchCategories();
    } catch {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Categories</h1>
        <Button variant="outline" onClick={fetchCategories} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card className="border-neutral/20">
        <CardHeader>
          <h2 className="text-lg font-bold text-primary">Create Category</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Topwear"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-parent">Parent (optional)</Label>
              <select
                id="cat-parent"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="h-10 w-full rounded-md border border-neutral/20 bg-background px-3 text-sm"
              >
                <option value="">None</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-image">Image URL (optional)</Label>
            <Input
              id="cat-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Drive URL or public URL"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-neutral/20">
        <CardHeader>
          <h2 className="text-lg font-bold text-primary">All Categories</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-secondary">Loading...</p>
          ) : categories.length === 0 ? (
            <p className="text-secondary">No categories found.</p>
          ) : (
            <div className="space-y-3">
              {categories
                .filter((c) => !c.parentId)
                .map((parent) => (
                  <div key={parent.id} className="border border-neutral/10 rounded-md p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-primary">{parent.name}</p>
                        <p className="text-xs text-secondary/60">{parent.slug}</p>
                      </div>
                      <Button variant="destructive" onClick={() => handleDelete(parent.id)}>
                        Delete
                      </Button>
                    </div>

                    {parent.subCategories?.length ? (
                      <div className="mt-3 pl-4 border-l border-neutral/10 space-y-2">
                        {parent.subCategories.map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-medium text-primary">{sub.name}</p>
                              <p className="text-xs text-secondary/60">{sub.slug}</p>
                            </div>
                            <Button variant="outline" onClick={() => handleDelete(sub.id)}>
                              Delete
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

