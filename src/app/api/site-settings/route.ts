import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSiteSettings, getSiteSettingsForAdmin, SITE_SETTING_KEYS } from "@/lib/site-settings";
import { prisma } from "@/lib/prisma";

/** Public: returns key-value map. With ?forAdmin=1 and admin auth, returns array with type/description for admin UI. */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forAdmin = searchParams.get("forAdmin") === "1" || searchParams.get("forAdmin") === "true";
    if (forAdmin) {
      const session = await auth();
      if ((session?.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const list = await getSiteSettingsForAdmin();
      return NextResponse.json(list);
    }
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Site settings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch site settings" }, { status: 500 });
  }
}

/** Admin only: update one or more settings. Body: { updates: { key: value } } or { key, value }. */
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updates: Record<string, string> =
      body.updates && typeof body.updates === "object"
        ? body.updates
        : body.key != null && body.value !== undefined
          ? { [body.key]: String(body.value) }
          : {};

    const allowedKeys = new Set<string>(Object.values(SITE_SETTING_KEYS));
    for (const key of Object.keys(updates)) {
      if (!allowedKeys.has(key)) {
        return NextResponse.json({ error: `Unknown setting key: ${key}` }, { status: 400 });
      }
    }

    const localOnlyImageKeys: string[] = [
      SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_1,
      SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_2,
      SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_3,
      SITE_SETTING_KEYS.EXPLORE_TRENDY_IMAGE,
      SITE_SETTING_KEYS.EXCLUSIVE_CTA_IMAGE,
    ];
    const isLocalImagePath = (v: string) => {
      const s = String(v).trim();
      if (!s) return true;
      return s.startsWith("/") && !s.startsWith("//") && !/^https?:\/\//i.test(s) && !s.includes("drive.google.com");
    };
    for (const key of localOnlyImageKeys) {
      const value = updates[key];
      if (value !== undefined && value !== null && String(value).trim() && !isLocalImagePath(String(value))) {
        return NextResponse.json(
          { error: "Images must be local paths only (e.g. /images/... or /uploads/...). Drive and external URLs are not allowed." },
          { status: 400 }
        );
      }
    }

    for (const [key, value] of Object.entries(updates)) {
      const type = key === SITE_SETTING_KEYS.PROMO_BAR_BG_COLOR ? "color" : "text";
      await prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: String(value), type },
        update: { value: String(value) },
      });
    }

    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Site settings PATCH error:", error);
    return NextResponse.json({ error: "Failed to update site settings" }, { status: 500 });
  }
}
