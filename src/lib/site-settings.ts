import { prisma } from "@/lib/prisma";

/** Known setting keys used across the app. Add new keys here when adding dynamic elements. */
export const SITE_SETTING_KEYS = {
  TOP_BAR_TEXT: "top_bar_text",
  PROMO_BAR_TEXT: "promo_bar_text",
  PROMO_BAR_BG_COLOR: "promo_bar_bg_color",
  // Shop by collection section (heading, subtext, 3 cards with image + label)
  SHOP_BY_COLLECTION_HEADING: "shop_by_collection_heading",
  SHOP_BY_COLLECTION_SUBTEXT: "shop_by_collection_subtext",
  SHOP_BY_COLLECTION_IMAGE_1: "shop_by_collection_image_1",
  SHOP_BY_COLLECTION_IMAGE_2: "shop_by_collection_image_2",
  SHOP_BY_COLLECTION_IMAGE_3: "shop_by_collection_image_3",
  SHOP_BY_COLLECTION_LABEL_1: "shop_by_collection_label_1",
  SHOP_BY_COLLECTION_LABEL_2: "shop_by_collection_label_2",
  SHOP_BY_COLLECTION_LABEL_3: "shop_by_collection_label_3",
  // Explore Trendy section (hero image, heading, subtext, 3 feature cards)
  EXPLORE_TRENDY_IMAGE: "explore_trendy_image",
  EXPLORE_TRENDY_HEADING: "explore_trendy_heading",
  EXPLORE_TRENDY_SUBTEXT: "explore_trendy_subtext",
  EXPLORE_TRENDY_CARD1_TITLE: "explore_trendy_card1_title",
  EXPLORE_TRENDY_CARD1_DESC: "explore_trendy_card1_desc",
  EXPLORE_TRENDY_CARD2_TITLE: "explore_trendy_card2_title",
  EXPLORE_TRENDY_CARD2_DESC: "explore_trendy_card2_desc",
  EXPLORE_TRENDY_CARD3_TITLE: "explore_trendy_card3_title",
  EXPLORE_TRENDY_CARD3_DESC: "explore_trendy_card3_desc",
  // Exclusive CTA section (heading, subtext, image, Shop Now button link + text)
  EXCLUSIVE_CTA_HEADING: "exclusive_cta_heading",
  EXCLUSIVE_CTA_SUBTEXT: "exclusive_cta_subtext",
  EXCLUSIVE_CTA_IMAGE: "exclusive_cta_image",
  EXCLUSIVE_CTA_BTN_LINK: "exclusive_cta_btn_link",
  EXCLUSIVE_CTA_BTN_TEXT: "exclusive_cta_btn_text",
  // FAQ section (heading and subtext on homepage)
  FAQ_HEADING: "faq_heading",
  FAQ_SUBTEXT: "faq_subtext",
} as const;

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[keyof typeof SITE_SETTING_KEYS];

/** Default values when no setting exists in DB. */
const DEFAULTS: Record<string, string> = {
  [SITE_SETTING_KEYS.TOP_BAR_TEXT]: "Free shipping on orders over ₹500",
  [SITE_SETTING_KEYS.PROMO_BAR_TEXT]: "New Arrivals • Free shipping on orders over ₹500 • Easy returns",
  [SITE_SETTING_KEYS.PROMO_BAR_BG_COLOR]: "",
  [SITE_SETTING_KEYS.SHOP_BY_COLLECTION_HEADING]: "Shop by collection",
  [SITE_SETTING_KEYS.SHOP_BY_COLLECTION_SUBTEXT]:
    "Explore our curated styles for Women, Men & Kids. Hover over each image to reveal the full look—premium quality, timeless pieces for every wardrobe.",
  [SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_1]: "/images/Women/women_collection.jpg",
  [SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_2]: "/images/Men/men_collection.avif",
  [SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_3]: "/images/kids/kids_collection.avif",
  [SITE_SETTING_KEYS.SHOP_BY_COLLECTION_LABEL_1]: "Women",
  [SITE_SETTING_KEYS.SHOP_BY_COLLECTION_LABEL_2]: "Men",
  [SITE_SETTING_KEYS.SHOP_BY_COLLECTION_LABEL_3]: "Kids",
  [SITE_SETTING_KEYS.EXPLORE_TRENDY_IMAGE]: "/images/Men/explore_trend.jpg",
  [SITE_SETTING_KEYS.EXPLORE_TRENDY_HEADING]: "Explore Trendy Styles And Elevate Your Fashion Game!",
  [SITE_SETTING_KEYS.EXPLORE_TRENDY_SUBTEXT]:
    "Discover curated collections that blend quality with affordability. From everyday essentials to statement pieces, find something that fits your vibe.",
  [SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD1_TITLE]: "Secure Shopping",
  [SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD1_DESC]: "Safe checkout and protected payments.",
  [SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD2_TITLE]: "Curated Picks",
  [SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD2_DESC]: "Personalized recommendations for you.",
  [SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD3_TITLE]: "Quality Imagery",
  [SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD3_DESC]: "High-quality product photos and details.",
  [SITE_SETTING_KEYS.EXCLUSIVE_CTA_HEADING]: "Shop Now For Exclusive Styles!",
  [SITE_SETTING_KEYS.EXCLUSIVE_CTA_SUBTEXT]:
    "Discover our latest collection. Quality fabrics, on-trend designs, and prices that don't break the bank.",
  [SITE_SETTING_KEYS.EXCLUSIVE_CTA_IMAGE]: "/images/Women/exclusive_style.jpg",
  [SITE_SETTING_KEYS.EXCLUSIVE_CTA_BTN_LINK]: "/products",
  [SITE_SETTING_KEYS.EXCLUSIVE_CTA_BTN_TEXT]: "Shop Now",
  [SITE_SETTING_KEYS.FAQ_HEADING]: "Frequently Asked Questions",
  [SITE_SETTING_KEYS.FAQ_SUBTEXT]: "Quick answers to common questions about shipping, returns, and more.",
};

/** Key -> type for admin UI (text | color | image_url). */
const KEY_TYPES: Record<string, "text" | "color" | "image_url"> = {
  [SITE_SETTING_KEYS.PROMO_BAR_BG_COLOR]: "color",
  [SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_1]: "image_url",
  [SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_2]: "image_url",
  [SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_3]: "image_url",
  [SITE_SETTING_KEYS.EXPLORE_TRENDY_IMAGE]: "image_url",
  [SITE_SETTING_KEYS.EXCLUSIVE_CTA_IMAGE]: "image_url",
};

/**
 * Sections for admin UI. Add new sections here when you add new homepage blocks.
 * Order of sections is the order shown in the admin form.
 */
export const SITE_SETTING_SECTIONS: {
  id: string;
  title: string;
  description: string;
  keys: readonly string[];
}[] = [
  {
    id: "hero",
    title: "Hero",
    description: "Top bar and hero area above the fold.",
    keys: [SITE_SETTING_KEYS.TOP_BAR_TEXT],
  },
  {
    id: "promo_bar",
    title: "Promo bar",
    description: "Announcement strip below the hero (text and background color).",
    keys: [SITE_SETTING_KEYS.PROMO_BAR_TEXT, SITE_SETTING_KEYS.PROMO_BAR_BG_COLOR],
  },
  {
    id: "shop_by_collection",
    title: "Shop by collection",
    description: "Heading, subtext, and the three collection cards (images and labels).",
    keys: [
      SITE_SETTING_KEYS.SHOP_BY_COLLECTION_HEADING,
      SITE_SETTING_KEYS.SHOP_BY_COLLECTION_SUBTEXT,
      SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_1,
      SITE_SETTING_KEYS.SHOP_BY_COLLECTION_LABEL_1,
      SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_2,
      SITE_SETTING_KEYS.SHOP_BY_COLLECTION_LABEL_2,
      SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_3,
      SITE_SETTING_KEYS.SHOP_BY_COLLECTION_LABEL_3,
    ],
  },
  {
    id: "explore_trendy",
    title: "Explore Trendy (feature section)",
    description: "Hero image, heading, subtext, and the three feature cards (Secure Shopping, Curated Picks, Quality Imagery).",
    keys: [
      SITE_SETTING_KEYS.EXPLORE_TRENDY_IMAGE,
      SITE_SETTING_KEYS.EXPLORE_TRENDY_HEADING,
      SITE_SETTING_KEYS.EXPLORE_TRENDY_SUBTEXT,
      SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD1_TITLE,
      SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD1_DESC,
      SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD2_TITLE,
      SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD2_DESC,
      SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD3_TITLE,
      SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD3_DESC,
    ],
  },
  {
    id: "exclusive_cta",
    title: "Exclusive CTA (Shop Now section)",
    description: "Heading, subtext, image, and Shop Now button (link + label).",
    keys: [
      SITE_SETTING_KEYS.EXCLUSIVE_CTA_HEADING,
      SITE_SETTING_KEYS.EXCLUSIVE_CTA_SUBTEXT,
      SITE_SETTING_KEYS.EXCLUSIVE_CTA_IMAGE,
      SITE_SETTING_KEYS.EXCLUSIVE_CTA_BTN_LINK,
      SITE_SETTING_KEYS.EXCLUSIVE_CTA_BTN_TEXT,
    ],
  },
  {
    id: "faq",
    title: "FAQ section",
    description: "Heading and subtext for the FAQ block on the homepage. FAQ items are managed under Admin → FAQs.",
    keys: [SITE_SETTING_KEYS.FAQ_HEADING, SITE_SETTING_KEYS.FAQ_SUBTEXT],
  },
];

/**
 * Returns all site settings as key -> value. Uses DB values when present, otherwise defaults.
 * Safe to call from server components and API.
 */
export async function getSiteSettings(): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany({ select: { key: true, value: true } });
  const map: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) {
    map[row.key] = row.value ?? DEFAULTS[row.key] ?? "";
  }
  return map;
}

/** Full record with type and description for admin UI. */
export async function getSiteSettingsForAdmin(): Promise<
  { id: string; key: string; value: string; type: string; description: string | null }[]
> {
  const rows = await prisma.siteSetting.findMany({
    orderBy: { key: "asc" },
  });
  const keySet = new Set(rows.map((r) => r.key));
  const withDefaults = [...rows];
  for (const key of Object.keys(DEFAULTS)) {
    if (!keySet.has(key)) {
      const type = KEY_TYPES[key] ?? "text";
      withDefaults.push({
        id: "",
        key,
        value: DEFAULTS[key],
        type,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as (typeof rows)[0] & { id: string });
    }
  }
  withDefaults.sort((a, b) => a.key.localeCompare(b.key));
  return withDefaults.map((r) => ({
    id: r.id,
    key: r.key,
    value: r.value,
    type: KEY_TYPES[r.key] ?? r.type,
    description: r.description,
  }));
}
