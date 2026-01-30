"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { getDrivePreviewUrl } from "@/lib/utils-drive";
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

type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  iconUrl?: string | null;
  description?: string | null;
  parentId?: string | null;
  level?: number;
  path?: string;
  showInNav?: boolean;
  isActive?: boolean;
  displayOrder?: number;
  children?: Category[];
};

export default function CategoriesAdminClient() {
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<Category[]>([]);
  const [flat, setFlat] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [quickAddParentId, setQuickAddParentId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editParentId, setEditParentId] = useState<string>("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editIconUrl, setEditIconUrl] = useState("");
  const [editShowInNav, setEditShowInNav] = useState(true);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editDisplayOrder, setEditDisplayOrder] = useState<string>("0");
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<{
    id: string;
    name: string;
    path?: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const parentOptions = useMemo(() => flat, [flat]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setFlat(Array.isArray(data?.flat) ? data.flat : []);
      setTree(Array.isArray(data?.tree) ? data.tree : []);
    } catch (e) {
      toast.error("Failed to load categories");
      setFlat([]);
      setTree([]);
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
          iconUrl: iconUrl.trim() || null,
          description: description.trim() || null,
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
      setIconUrl("");
      setDescription("");
      await fetchCategories();
    } catch {
      toast.error("Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAdd = async (parentIdForChild: string, childName: string) => {
    if (!childName.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: childName.trim(),
          parentId: parentIdForChild,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to create category");
        return;
      }
      toast.success("Category created");
      setQuickAddParentId(null);
      await fetchCategories();
      setExpanded((prev) => ({ ...prev, [parentIdForChild]: true }));
    } catch {
      toast.error("Failed to create category");
    }
  };

  const performDelete = async (id: string) => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        const message = data?.error || "Failed to delete category";
        setDeleteError(message);
        toast.error(message);
        return;
      }
      toast.success("Category deleted");
      setDeleteConfirmCategory(null);
      await fetchCategories();
    } catch {
      const message = "Failed to delete category";
      setDeleteError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const beginEdit = (node: Category) => {
    setEditingNodeId(node.id);
    setEditName(node.name || "");
    setEditParentId(node.parentId || "");
    setEditImageUrl((node as any).imageUrl ?? "");
    setEditIconUrl((node as any).iconUrl ?? "");
    setEditShowInNav(node.showInNav !== false);
    setEditIsActive(node.isActive !== false);
    setEditDisplayOrder(String((node as any).displayOrder ?? 0));
  };

  const cancelEdit = () => {
    setEditingNodeId(null);
    setEditName("");
    setEditParentId("");
    setEditImageUrl("");
    setEditIconUrl("");
    setEditShowInNav(true);
    setEditIsActive(true);
    setEditDisplayOrder("0");
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          parentId: editParentId || null,
          imageUrl: editImageUrl.trim() || null,
          iconUrl: editIconUrl.trim() || null,
          showInNav: editShowInNav,
          isActive: editIsActive,
          displayOrder: Number(editDisplayOrder) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to update category");
        return;
      }
      toast.success("Category updated");
      cancelEdit();
      await fetchCategories();
    } catch {
      toast.error("Failed to update category");
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (node: Category) => {
    const hasChildren = !!node.children?.length;
    const isExpanded = !!expanded[node.id];

    const nodeImageUrl = (node as any).imageUrl ?? (node as any).iconUrl ?? "";
    return (
      <div key={node.id} className="border border-neutral/10 rounded-md p-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            {hasChildren ? (
              <button
                className="shrink-0 text-xs px-2 py-1 border border-neutral/20 rounded"
                onClick={() => toggleExpand(node.id)}
              >
                {isExpanded ? "−" : "+"}
              </button>
            ) : (
              <span className="w-7 shrink-0" />
            )}
            <div
              className="shrink-0 w-10 h-10 rounded border border-neutral/20 bg-muted/50 overflow-hidden flex items-center justify-center"
              title="Category image"
            >
              {nodeImageUrl ? (
                <img
                  src={getDrivePreviewUrl(nodeImageUrl)}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const next = e.currentTarget.nextElementSibling as HTMLElement;
                    if (next) next.classList.remove("hidden");
                  }}
                />
              ) : (
                <span className="text-[10px] text-muted-foreground">—</span>
              )}
              <span className="hidden text-[10px] text-muted-foreground">—</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-primary truncate">{node.name}</p>
              <p className="text-xs text-secondary/60 truncate">
                {node.path || `/${node.slug}`}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => beginEdit(node)}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setQuickAddParentId(node.id);
                setExpanded((prev) => ({ ...prev, [node.id]: true }));
              }}
            >
              Add Child
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                setDeleteConfirmCategory({
                  id: node.id,
                  name: node.name,
                  path: node.path,
                })
              }
            >
              Delete
            </Button>
          </div>
        </div>

        {editingNodeId === node.id && (
          <div className="mt-3 p-3 bg-background rounded-md border border-neutral/10 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Parent</Label>
                <select
                  value={editParentId}
                  onChange={(e) => setEditParentId(e.target.value)}
                  className="h-10 w-full rounded-md border border-neutral/20 bg-background px-3 text-sm"
                >
                  <option value="">None (root)</option>
                  {parentOptions
                    .filter((c) => c.id !== node.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.path || `/${c.slug}`} — {c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Image URL</Label>
                <div className="flex gap-2 items-center">
                  <div className="shrink-0 w-12 h-12 rounded border border-neutral/20 bg-muted/50 overflow-hidden flex items-center justify-center">
                    {!editImageUrl.trim() ? (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    ) : (
                      <img
                        src={getDrivePreviewUrl(editImageUrl.trim())}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const el = e.currentTarget.nextElementSibling as HTMLElement;
                          if (el) el.classList.remove("hidden");
                        }}
                      />
                    )}
                    <span className="hidden text-[10px] text-muted-foreground">—</span>
                  </div>
                  <Input
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="Drive or public URL"
                    className="flex-1 min-w-0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Icon URL</Label>
                <div className="flex gap-2 items-center">
                  <div className="shrink-0 w-12 h-12 rounded border border-neutral/20 bg-muted/50 overflow-hidden flex items-center justify-center">
                    {!editIconUrl.trim() ? (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    ) : (
                      <img
                        src={getDrivePreviewUrl(editIconUrl.trim())}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const el = e.currentTarget.nextElementSibling as HTMLElement;
                          if (el) el.classList.remove("hidden");
                        }}
                      />
                    )}
                    <span className="hidden text-[10px] text-muted-foreground">—</span>
                  </div>
                  <Input
                    value={editIconUrl}
                    onChange={(e) => setEditIconUrl(e.target.value)}
                    placeholder="Icon URL"
                    className="flex-1 min-w-0"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Display order</Label>
                <Input value={editDisplayOrder} onChange={(e) => setEditDisplayOrder(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editShowInNav}
                  onChange={(e) => setEditShowInNav(e.target.checked)}
                />
                Show in nav
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                />
                Active
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
              <Button onClick={() => handleUpdate(node.id)}>Save</Button>
            </div>
          </div>
        )}

        {quickAddParentId === node.id && (
          <div className="mt-3 p-3 bg-neutral/5 rounded-md border border-neutral/10">
            <Label className="text-xs">New child under “{node.name}”</Label>
            <div className="mt-2 flex gap-2">
              <Input
                autoFocus
                placeholder="Child category name (e.g. Full Sleeve)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const value = (e.target as HTMLInputElement).value;
                    handleQuickAdd(node.id, value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={(e) => {
                  const input = (e.currentTarget.parentElement?.querySelector("input") as HTMLInputElement) || null;
                  if (!input) return;
                  handleQuickAdd(node.id, input.value);
                  input.value = "";
                }}
              >
                Create
              </Button>
              <Button variant="outline" onClick={() => setQuickAddParentId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {hasChildren && isExpanded ? (
          <div className="mt-3 pl-6 border-l border-neutral/10 space-y-3">
            {node.children!.map(renderNode)}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <AlertDialog
        open={!!deleteConfirmCategory}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmCategory(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmCategory && (
                <>
                  <span className="font-medium text-primary block mb-1">
                    &ldquo;{deleteConfirmCategory.name}&rdquo;
                    {deleteConfirmCategory.path && (
                      <span className="text-secondary font-normal ml-1">
                        ({deleteConfirmCategory.path})
                      </span>
                    )}
                  </span>
                  This will permanently delete this category and all its subcategories. If this category or any of its subcategories contain products, you must delete or move those products first—otherwise the delete will fail.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                if (deleteConfirmCategory) performDelete(deleteConfirmCategory.id);
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Categories</h1>
        <Button variant="outline" onClick={fetchCategories} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card className="border-neutral/20">
        <CardHeader>
          <h2 className="text-lg font-bold text-primary">Create Category (any depth)</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Men's Wear / T-Shirts / Full Sleeve"
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
                    {c.path || `/${c.slug}`} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cat-image">Image URL (optional)</Label>
              <div className="flex gap-2 items-center">
                <div
                  className="shrink-0 w-14 h-14 rounded-md border border-neutral/20 bg-muted/50 overflow-hidden flex items-center justify-center"
                  title={imageUrl.trim() ? "Preview" : "Paste link"}
                >
                  {!imageUrl.trim() ? (
                    <span className="text-[10px] text-muted-foreground text-center px-1">Preview</span>
                  ) : (
                    <img
                      src={getDrivePreviewUrl(imageUrl.trim())}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const next = e.currentTarget.nextElementSibling as HTMLElement;
                        if (next) next.classList.remove("hidden");
                      }}
                    />
                  )}
                  <span className="hidden text-[10px] text-muted-foreground px-1">Couldn&apos;t load</span>
                </div>
                <Input
                  id="cat-image"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Drive URL or public URL"
                  className="flex-1 min-w-0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icon URL (optional)</Label>
              <div className="flex gap-2 items-center">
                <div
                  className="shrink-0 w-14 h-14 rounded-md border border-neutral/20 bg-muted/50 overflow-hidden flex items-center justify-center"
                  title={iconUrl.trim() ? "Preview" : "Paste link"}
                >
                  {!iconUrl.trim() ? (
                    <span className="text-[10px] text-muted-foreground text-center px-1">Preview</span>
                  ) : (
                    <img
                      src={getDrivePreviewUrl(iconUrl.trim())}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const next = e.currentTarget.nextElementSibling as HTMLElement;
                        if (next) next.classList.remove("hidden");
                      }}
                    />
                  )}
                  <span className="hidden text-[10px] text-muted-foreground px-1">Couldn&apos;t load</span>
                </div>
                <Input
                  id="cat-icon"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="Small icon or Drive URL"
                  className="flex-1 min-w-0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-desc">Description (optional)</Label>
            <textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20 w-full rounded-md border border-neutral/20 bg-background px-3 py-2 text-sm"
              placeholder="Optional description for SEO / listing pages"
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
          <h2 className="text-lg font-bold text-primary">Category Tree</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-secondary">Loading...</p>
          ) : tree.length === 0 ? (
            <p className="text-secondary">No categories found.</p>
          ) : (
            <div className="space-y-3">
              {tree.map(renderNode)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

