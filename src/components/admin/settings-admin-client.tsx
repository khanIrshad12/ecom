"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { PALETTE_COLORS } from "@/lib/utils-color";
import { SITE_SETTING_SECTIONS } from "@/lib/site-settings";

type SettingRow = {
  id: string;
  key: string;
  value: string;
  type: string;
  description: string | null;
};

const KEY_LABELS: Record<string, string> = {
  top_bar_text: "Top bar text",
  promo_bar_text: "Promo bar text",
  promo_bar_bg_color: "Background color",
  shop_by_collection_heading: "Heading",
  shop_by_collection_subtext: "Subtext",
  shop_by_collection_image_1: "Card 1 image (local only)",
  shop_by_collection_image_2: "Card 2 image (local only)",
  shop_by_collection_image_3: "Card 3 image (local only)",
  shop_by_collection_label_1: "Card 1 label",
  shop_by_collection_label_2: "Card 2 label",
  shop_by_collection_label_3: "Card 3 label",
  explore_trendy_image: "Hero image (local only)",
  explore_trendy_heading: "Heading",
  explore_trendy_subtext: "Subtext",
  explore_trendy_card1_title: "Card 1 title (Secure Shopping)",
  explore_trendy_card1_desc: "Card 1 description",
  explore_trendy_card2_title: "Card 2 title (Curated Picks)",
  explore_trendy_card2_desc: "Card 2 description",
  explore_trendy_card3_title: "Card 3 title (Quality Imagery)",
  explore_trendy_card3_desc: "Card 3 description",
  exclusive_cta_heading: "Heading",
  exclusive_cta_subtext: "Subtext",
  exclusive_cta_image: "Image (local only)",
  exclusive_cta_btn_link: "Shop Now button link (e.g. /products)",
  exclusive_cta_btn_text: "Shop Now button text",
  faq_heading: "FAQ section heading",
  faq_subtext: "FAQ section subtext",
};

/** Image keys that allow only local paths and show Select from library. */
const LOCAL_IMAGE_KEYS = [
  "shop_by_collection_image_1",
  "shop_by_collection_image_2",
  "shop_by_collection_image_3",
  "explore_trendy_image",
  "exclusive_cta_image",
];

function isLocalImagePath(value: string): boolean {
  const s = value.trim();
  if (!s) return true;
  return s.startsWith("/") && !s.startsWith("//") && !/^https?:\/\//i.test(s) && !s.includes("drive.google.com");
}

export default function SettingsAdminClient() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [libraryOpenForKey, setLibraryOpenForKey] = useState<string | null>(null);
  const [libraryPaths, setLibraryPaths] = useState<string[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/site-settings?forAdmin=1");
      if (!res.ok) throw new Error("Unauthorized or failed");
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
      const initial: Record<string, string> = {};
      (Array.isArray(data) ? data : []).forEach((r: SettingRow) => {
        initial[r.key] = r.value ?? "";
      });
      setValues(initial);
    } catch {
      toast.error("Failed to load site settings");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const setValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const openImageLibrary = async (key: string) => {
    setLibraryOpenForKey(key);
    setLibraryLoading(true);
    setLibraryPaths([]);
    try {
      const res = await fetch("/api/public-images");
      const data = await res.json();
      if (res.ok && Array.isArray(data.paths)) setLibraryPaths(data.paths);
      else toast.error("Failed to load image library");
    } catch {
      toast.error("Failed to load image library");
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleFileUpload = async (key: string, file: File) => {
    setUploadingKey(key);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Upload failed");
        return;
      }
      setValue(key, data.url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSave = async () => {
    for (const key of LOCAL_IMAGE_KEYS) {
      const value = values[key] ?? "";
      if (value.trim() && !isLocalImagePath(value)) {
        toast.error(
          "Shop by collection images must be local paths only (e.g. /images/... or use Upload). Google Drive and other external URLs are not allowed."
        );
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch("/api/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: values }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to save");
        return;
      }
      toast.success("Site settings saved");
      setValues(data);
    } catch {
      toast.error("Failed to save site settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-secondary">Loading site settings…</div>
    );
  }

  const rowsByKey = new Map(rows.map((r) => [r.key, r]));

  function renderField(row: SettingRow) {
    return (
      <div key={row.key} className="space-y-2">
        <Label htmlFor={`setting-${row.key}`}>
          {KEY_LABELS[row.key] ?? row.key.replace(/_/g, " ")}
        </Label>
        {row.type === "color" ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              id={`setting-${row.key}`}
              type="color"
              value={values[row.key] && /^#[0-9A-Fa-f]{6}$/.test(values[row.key]) ? values[row.key] : "#000000"}
              onChange={(e) => setValue(row.key, e.target.value)}
              className="h-10 w-14 rounded border border-neutral/30 cursor-pointer bg-transparent"
            />
            <Input
              placeholder="#000000"
              value={values[row.key] ?? ""}
              onChange={(e) => setValue(row.key, e.target.value)}
              className="max-w-[140px] font-mono"
            />
            <div className="flex flex-wrap gap-1">
              {PALETTE_COLORS.slice(0, 12).map(({ name, hex }) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  className="w-6 h-6 rounded border border-neutral/30 hover:ring-2 ring-primary"
                  style={{ backgroundColor: hex }}
                  onClick={() => setValue(row.key, hex)}
                />
              ))}
            </div>
          </div>
        ) : row.type === "image_url" ? (
          <div className="flex flex-col gap-2">
            <Input
              id={`setting-${row.key}`}
              value={values[row.key] ?? ""}
              onChange={(e) => setValue(row.key, e.target.value)}
              placeholder={
                LOCAL_IMAGE_KEYS.includes(row.key)
                  ? "Local path only (e.g. /images/... or /uploads/...)"
                  : "Local path (e.g. /images/...)"
              }
              className={
                LOCAL_IMAGE_KEYS.includes(row.key) && values[row.key]?.trim() && !isLocalImagePath(values[row.key] ?? "")
                  ? "border-destructive"
                  : ""
              }
            />
            {LOCAL_IMAGE_KEYS.includes(row.key) && values[row.key]?.trim() && !isLocalImagePath(values[row.key] ?? "") && (
              <p className="text-xs text-destructive">
                Use a local path (e.g. /images/...) or upload an image. Drive and external URLs are not allowed.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id={`upload-${row.key}`}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(row.key, f);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(`upload-${row.key}`)?.click()}
                disabled={uploadingKey === row.key}
              >
                {uploadingKey === row.key ? "Uploading…" : "Upload image"}
              </Button>
              {LOCAL_IMAGE_KEYS.includes(row.key) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openImageLibrary(row.key)}
                >
                  Select from library
                </Button>
              )}
              {LOCAL_IMAGE_KEYS.includes(row.key) && (
                <span className="text-xs text-secondary">Local images only</span>
              )}
            </div>
          </div>
        ) : (
          <Input
            id={`setting-${row.key}`}
            value={values[row.key] ?? ""}
            onChange={(e) => setValue(row.key, e.target.value)}
            placeholder={row.key}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Site content &amp; styling</h1>
        <p className="text-secondary text-sm mt-1">
          Edit content by section. Add new sections in code when you add new homepage blocks.
        </p>
      </div>

      {SITE_SETTING_SECTIONS.map((section) => {
        const sectionRows = section.keys
          .map((key) => rowsByKey.get(key))
          .filter((r): r is SettingRow => r != null);
        if (sectionRows.length === 0) return null;

        return (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sectionRows.map((row) => renderField(row))}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save all"}
        </Button>
      </div>

      {/* Image library modal */}
      {libraryOpenForKey != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setLibraryOpenForKey(null)}
        >
          <div
            className="bg-background border border-neutral/20 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral/20">
              <h3 className="font-semibold text-primary">Select from library</h3>
              <Button variant="ghost" size="sm" onClick={() => setLibraryOpenForKey(null)}>
                Close
              </Button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              {libraryLoading ? (
                <p className="text-secondary text-sm">Loading…</p>
              ) : libraryPaths.length === 0 ? (
                <p className="text-secondary text-sm">No images in public/images or public/uploads.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {libraryPaths.map((imgPath) => (
                    <button
                      key={imgPath}
                      type="button"
                      className="aspect-square rounded-lg overflow-hidden border border-neutral/20 hover:border-primary hover:ring-2 ring-primary/30 transition"
                      onClick={() => {
                        setValue(libraryOpenForKey, imgPath);
                        setLibraryOpenForKey(null);
                      }}
                    >
                      <img
                        src={imgPath}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

