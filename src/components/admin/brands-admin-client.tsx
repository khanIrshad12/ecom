"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
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
import { getDrivePreviewUrl } from "@/lib/utils-drive";

type Brand = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  isActive: boolean;
  displayOrder: number;
};

export default function BrandsAdminClient() {
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editDisplayOrder, setEditDisplayOrder] = useState("0");
  const [editIsActive, setEditIsActive] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brands");
      const data = await res.json();
      setBrands(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load brands");
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (!editingId) return;
    const brand = brands.find((b) => b.id === editingId);
    if (brand) {
      setEditName(brand.name);
      setEditLogoUrl(brand.logoUrl ?? "");
      setEditDisplayOrder(String(brand.displayOrder ?? 0));
      setEditIsActive(brand.isActive !== false);
    }
  }, [editingId, brands]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Brand name is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          logoUrl: logoUrl.trim() || null,
          displayOrder: Number(displayOrder) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to create brand");
        return;
      }
      toast.success("Brand created");
      setName("");
      setLogoUrl("");
      setDisplayOrder("0");
      await fetchBrands();
    } catch {
      toast.error("Failed to create brand");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/brands/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          logoUrl: editLogoUrl.trim() || null,
          displayOrder: Number(editDisplayOrder) || 0,
          isActive: editIsActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to update brand");
        return;
      }
      toast.success("Brand updated");
      setEditingId(null);
      await fetchBrands();
    } catch {
      toast.error("Failed to update brand");
    } finally {
      setSubmitting(false);
    }
  };

  const performDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/brands/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to delete brand");
        setDeleteConfirm(null);
        return;
      }
      toast.success("Brand deleted");
      setDeleteConfirm(null);
      if (editingId === id) setEditingId(null);
      await fetchBrands();
    } catch {
      toast.error("Failed to delete brand");
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete brand?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm && (
                <>
                  &ldquo;{deleteConfirm.name}&rdquo; will be deleted. Products linked to this brand will be unlinked (brand set to none).
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
                if (deleteConfirm) performDelete(deleteConfirm.id);
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Brands</h1>
        <Button variant="outline" onClick={fetchBrands} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card className="border-neutral/20">
        <CardHeader>
          <h2 className="text-lg font-bold text-primary">Create Brand</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Name</Label>
              <Input
                id="brand-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nike"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-logo">Logo URL (optional)</Label>
              <div className="flex gap-2 items-center">
                {logoUrl.trim() && (
                  <div className="shrink-0 w-12 h-12 rounded border border-neutral/20 overflow-hidden bg-muted/50 flex items-center justify-center">
                    <img
                      src={getDrivePreviewUrl(logoUrl.trim())}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <Input
                  id="brand-logo"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Drive or public URL"
                  className="flex-1 min-w-0"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="brand-order">Display order</Label>
            <Input
              id="brand-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              placeholder="0"
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
          <h2 className="text-lg font-bold text-primary">All Brands</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-secondary">Loading...</p>
          ) : brands.length === 0 ? (
            <p className="text-secondary">No brands found.</p>
          ) : (
            <div className="space-y-3">
              {brands.map((b) => (
                <div key={b.id} className="border border-neutral/10 rounded-md p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {b.logoUrl && (
                        <div className="shrink-0 w-10 h-10 rounded border border-neutral/20 overflow-hidden bg-muted/50 flex items-center justify-center">
                          <img
                            src={getDrivePreviewUrl(b.logoUrl)}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-primary">{b.name}</p>
                        <p className="text-xs text-secondary/60">{b.slug}</p>
                        <p className="text-xs text-secondary">
                          Order: {b.displayOrder} · {b.isActive ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setEditingId(editingId === b.id ? null : b.id)}
                      >
                        {editingId === b.id ? "Cancel" : "Edit"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setDeleteConfirm({ id: b.id, name: b.name })}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {editingId === b.id && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-md space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Logo URL</Label>
                          <Input value={editLogoUrl} onChange={(e) => setEditLogoUrl(e.target.value)} placeholder="Optional" />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="space-y-2 max-w-[100px]">
                          <Label>Display order</Label>
                          <Input
                            type="number"
                            value={editDisplayOrder}
                            onChange={(e) => setEditDisplayOrder(e.target.value)}
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editIsActive}
                            onChange={(e) => setEditIsActive(e.target.checked)}
                          />
                          Active
                        </label>
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={() => handleUpdate(b.id)} disabled={submitting}>
                          {submitting ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
