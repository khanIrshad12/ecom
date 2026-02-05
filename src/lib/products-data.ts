import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ProductsSearchParams } from "@/lib/products-search-params";

const productWithRelationsInclude = {
  images: true,
  variants: true,
  category: true,
  brand: true,
} as const;

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productWithRelationsInclude;
}>;

export type ProductsFacets = {
  minPrice: number;
  maxPrice: number;
  colors: string[];
  sizes: string[];
  brands: { id: string; name: string; slug: string }[];
  ratingBuckets: number[]; // e.g. [4, 3, 2] for "4 & up", "3 & up"
  hasSale: boolean;
  hasTrending: boolean;
};

async function resolveCategoryIds(
  params: ProductsSearchParams
): Promise<string[] | null> {
  const { categoryId, categoryPath, categorySlug, path, category, gender } = params;
  let categoryIds: string[] | null = null;
  const hasCategoryFilter = Boolean(categoryId || categoryPath || categorySlug || path || category);

  // Optional: narrow by gender (root category tree)
  let genderCategoryIds: string[] | null = null;
  if (gender) {
    const root = await prisma.category.findFirst({
      where: { parentId: null, isActive: true, slug: gender.toLowerCase() },
      select: { id: true },
    });
    if (root) {
      const ids = new Set<string>([root.id]);
      let toExpand: string[] = [root.id];
      for (let i = 0; i < 10 && toExpand.length > 0; i++) {
        const children = await prisma.category.findMany({
          where: { isActive: true, parentId: { in: toExpand } },
          select: { id: true },
        });
        children.forEach((c) => ids.add(c.id));
        toExpand = children.map((c) => c.id);
      }
      genderCategoryIds = Array.from(ids);
    }
  }

  if (categoryId) {
    const cat = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, isActive: true },
    });
    if (cat && cat.isActive) {
      const ids = new Set<string>([cat.id]);
      let toExpand: string[] = [cat.id];
      for (let i = 0; i < 10 && toExpand.length > 0; i++) {
        const children = await prisma.category.findMany({
          where: { isActive: true, parentId: { in: toExpand } },
          select: { id: true },
        });
        children.forEach((c) => ids.add(c.id));
        toExpand = children.map((c) => c.id);
      }
      categoryIds = Array.from(ids);
    } else {
      categoryIds = [];
    }
  } else {
    let dbPath: string | undefined;
    const pathFromUrl = (categoryPath ?? path)?.replace(/\/$/, "").replace(/^\/*/, "/");
    const slugFromPath = pathFromUrl?.replace(/^\//, "").toLowerCase();

    if (pathFromUrl) {
      const byPath = await prisma.category.findFirst({
        where: { path: pathFromUrl, isActive: true },
        select: { path: true },
      });
      const bySlug =
        !byPath && slugFromPath
          ? await prisma.category.findFirst({
              where: { slug: slugFromPath, isActive: true },
              select: { path: true },
            })
          : null;
      dbPath = byPath?.path ?? bySlug?.path ?? undefined;
    } else if (categorySlug ?? category) {
      const slug = (categorySlug ?? category)?.toLowerCase();
      const cat = slug
        ? await prisma.category.findFirst({
            where: { slug, isActive: true },
            select: { path: true },
          })
        : null;
      dbPath = cat?.path ?? undefined;
    }

    if (dbPath) {
      const matching = await prisma.category.findMany({
        where: {
          isActive: true,
          OR: [{ path: dbPath }, { path: { startsWith: dbPath + "/" } }],
        },
        select: { id: true },
      });
      categoryIds = matching.map((c) => c.id);
    } else if (hasCategoryFilter) {
      categoryIds = [];
    }
  }

  // Intersect with gender if both present
  if (genderCategoryIds != null) {
    if (categoryIds == null) return genderCategoryIds;
    categoryIds = categoryIds.filter((id) => genderCategoryIds!.includes(id));
  }
  return categoryIds;
}

export async function getProductsAndFacets(
  params: ProductsSearchParams
): Promise<{ products: ProductWithRelations[]; facets: ProductsFacets }> {
  const categoryIds = await resolveCategoryIds(params);

  // Base where: category, search, trending, rating, brand (no color/size/sale/price)
  const baseWhere: Parameters<typeof prisma.product.findMany>[0]["where"] = {};

  if (categoryIds !== null) {
    baseWhere.categoryId = { in: categoryIds };
  }

  // Search: applied in-memory (case-insensitive, keyword-style) so it works with MongoDB
  const searchWords = params.q?.trim() ? params.q.trim().split(/\s+/).filter(Boolean) : null;
  function matchesSearch(product: ProductWithRelations): boolean {
    if (!searchWords?.length) return true;
    const nameLower = product.name.toLowerCase();
    const descLower = product.description.toLowerCase();
    return searchWords.every(
      (word) => nameLower.includes(word.toLowerCase()) || descLower.includes(word.toLowerCase())
    );
  }

  if (params.trending) {
    baseWhere.isTrending = true;
  }

  if (params.minRating != null && params.minRating > 0) {
    baseWhere.rating = { gte: params.minRating };
  }

  if (params.brand?.length) {
    // MongoDB ObjectIds are 24 hex chars; avoid passing slugs into id filter
    const validId = /^[0-9a-fA-F]{24}$/;
    const brandIds = params.brand.filter((b) => validId.test(b));
    const brandSlugs = params.brand.filter((b) => !validId.test(b));
    const orConditions: Array<{ id?: { in: string[] }; slug?: { in: string[] } }> = [];
    if (brandIds.length) orConditions.push({ id: { in: brandIds } });
    if (brandSlugs.length) orConditions.push({ slug: { in: brandSlugs } });
    if (orConditions.length > 0) {
      const brands = await prisma.brand.findMany({
        where: {
          OR: orConditions,
          isActive: true,
        },
        select: { id: true },
      });
      const ids = brands.map((b) => b.id);
      if (ids.length) baseWhere.brandId = { in: ids };
    }
  }

  // Variant filters (color, size, sale, price) applied only to the product result set
  const variantWhere: Parameters<typeof prisma.product.findMany>[0]["where"]["variants"] = { some: {} };
  const variantConditions: Record<string, unknown> = {};

  if (params.minPrice != null || params.maxPrice != null) {
    const price: Record<string, number> = {};
    if (params.minPrice != null) price.gte = params.minPrice;
    if (params.maxPrice != null) price.lte = params.maxPrice;
    variantConditions.price = price;
  }
  if (params.color?.length) {
    variantConditions.color = { in: params.color };
  }
  if (params.size?.length) {
    variantConditions.size = { in: params.size };
  }
  if (params.sale) {
    variantConditions.actualPrice = { not: null };
  }

  const where = { ...baseWhere };
  if (Object.keys(variantConditions).length > 0) {
    (variantWhere as any).some = variantConditions;
    where.variants = variantWhere;
  }

  // Facets: computed from the broad set (category + search, no color/size/sale/price)
  // so filter options (e.g. all colors) stay visible when user selects one
  const facetProductsRaw = await prisma.product.findMany({
    where: baseWhere,
    include: productWithRelationsInclude,
  });
  const facetProducts = searchWords ? facetProductsRaw.filter(matchesSearch) : facetProductsRaw;
  const facets = computeFacets(facetProducts);

  // Products: full filters (including color, size, sale, price)
  const productsRaw = await prisma.product.findMany({
    where,
    include: productWithRelationsInclude,
    orderBy: params.sort === "price_asc" || params.sort === "price_desc" ? undefined : { createdAt: "desc" },
  });

  let filtered = searchWords ? productsRaw.filter(matchesSearch) : productsRaw;

  if (params.sale) {
    filtered = filtered.filter((p) =>
      p.variants.some((v) => v.actualPrice != null && v.actualPrice > v.price)
    );
  }

  if (params.sort === "price_asc" || params.sort === "price_desc") {
    filtered = [...filtered].sort((a, b) => {
      const minA = Math.min(...a.variants.map((v) => v.price));
      const minB = Math.min(...b.variants.map((v) => v.price));
      return params.sort === "price_asc" ? minA - minB : minB - minA;
    });
  }

  return { products: filtered, facets };
}

function computeFacets(products: ProductWithRelations[]): ProductsFacets {
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  const colorSet = new Set<string>();
  const sizeSet = new Set<string>();
  const brandMap = new Map<string, { id: string; name: string; slug: string }>();
  const ratingSet = new Set<number>();
  let hasSale = false;
  let hasTrending = false;

  for (const p of products) {
    for (const v of p.variants) {
      if (v.price < minPrice) minPrice = v.price;
      if (v.price > maxPrice) maxPrice = v.price;
      colorSet.add(v.color);
      sizeSet.add(v.size);
      if (v.actualPrice != null && v.actualPrice > v.price) hasSale = true;
    }
    if (p.brand) {
      brandMap.set(p.brand.id, { id: p.brand.id, name: p.brand.name, slug: p.brand.slug });
    }
    if (p.rating != null) ratingSet.add(Math.floor(p.rating));
    if (p.isTrending) hasTrending = true;
  }

  const ratingBuckets = [5, 4, 3, 2, 1].filter((r) => ratingSet.has(r));

  return {
    minPrice: Number.isFinite(minPrice) ? minPrice : 0,
    maxPrice: maxPrice > -Infinity ? maxPrice : 0,
    colors: Array.from(colorSet).sort(),
    sizes: Array.from(sizeSet).sort(),
    brands: Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    ratingBuckets,
    hasSale,
    hasTrending,
  };
}
