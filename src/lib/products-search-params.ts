/**
 * Parse and build URL search params for products page (filters, sort, search).
 * All filter options are dynamic from DB; this only parses the URL.
 */

export type ProductsSearchParams = {
  categoryId?: string;
  path?: string;
  category?: string;
  q?: string;
  sort?: "new" | "price_asc" | "price_desc" | "relevance";
  minPrice?: number;
  maxPrice?: number;
  color?: string[];
  size?: string[];
  sale?: boolean;
  gender?: "men" | "women" | "kids";
  trending?: boolean;
  minRating?: number;
  brand?: string[]; // slugs or ids
};

const SORT_VALUES = ["new", "price_asc", "price_desc", "relevance"] as const;

export function parseProductsSearchParams(
  params: Record<string, string | string[] | undefined>
): ProductsSearchParams {
  const getStr = (k: string) => {
    const v = params[k];
    if (v == null) return undefined;
    return Array.isArray(v) ? v[0] : v;
  };
  const getNum = (k: string): number | undefined => {
    const s = getStr(k);
    if (s == null || s === "") return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };
  const getList = (k: string): string[] | undefined => {
    const v = params[k];
    if (v == null) return undefined;
    const s = Array.isArray(v) ? v.join(",") : v;
    const list = s.split(",").map((x) => x.trim()).filter(Boolean);
    return list.length ? list : undefined;
  };

  const sortRaw = getStr("sort");
  const sort = sortRaw && SORT_VALUES.includes(sortRaw as any) ? (sortRaw as ProductsSearchParams["sort"]) : undefined;

  return {
    categoryId: getStr("categoryId"),
    path: getStr("path"),
    category: getStr("category"),
    q: getStr("q")?.trim() || undefined,
    sort,
    minPrice: getNum("minPrice"),
    maxPrice: getNum("maxPrice"),
    color: getList("color"),
    size: getList("size"),
    sale: getStr("sale") === "1" || getStr("sale") === "true",
    gender: (() => {
      const g = getStr("gender")?.toLowerCase();
      if (g === "men" || g === "women" || g === "kids") return g;
      return undefined;
    })(),
    trending: getStr("trending") === "1" || getStr("trending") === "true",
    minRating: getNum("minRating"),
    brand: getList("brand"),
  };
}

/** Build URL search string from parsed params (for filter UI links). */
export function buildProductsSearchString(
  current: ProductsSearchParams,
  updates: Partial<ProductsSearchParams>
): string {
  const merged = { ...current, ...updates };
  const sp = new URLSearchParams();

  if (merged.categoryId) sp.set("categoryId", merged.categoryId);
  if (merged.path) sp.set("path", merged.path);
  if (merged.category) sp.set("category", merged.category);
  if (merged.q) sp.set("q", merged.q);
  if (merged.sort && merged.sort !== "new") sp.set("sort", merged.sort);
  if (merged.minPrice != null) sp.set("minPrice", String(merged.minPrice));
  if (merged.maxPrice != null) sp.set("maxPrice", String(merged.maxPrice));
  if (merged.color?.length) sp.set("color", merged.color.join(","));
  if (merged.size?.length) sp.set("size", merged.size.join(","));
  if (merged.sale) sp.set("sale", "1");
  if (merged.gender) sp.set("gender", merged.gender);
  if (merged.trending) sp.set("trending", "1");
  if (merged.minRating != null) sp.set("minRating", String(merged.minRating));
  if (merged.brand?.length) sp.set("brand", merged.brand.join(","));

  const s = sp.toString();
  return s ? `?${s}` : "";
}
