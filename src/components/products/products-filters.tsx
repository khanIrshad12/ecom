"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useState, useEffect, useRef } from "react";
import {
  buildProductsSearchString,
  type ProductsSearchParams,
} from "@/lib/products-search-params";
import type { ProductsFacets } from "@/lib/products-data";
import { getColorSwatchValue, getColorDisplayName } from "@/lib/utils-color";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontalIcon, ArrowUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { value: ProductsSearchParams["sort"]; label: string }[] = [
  { value: "new", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "relevance", label: "Relevance" },
];

function FilterSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      {children}
    </div>
  );
}

function FilterFormContent({
  params,
  facets,
  onNavigate,
  onCloseSheet,
}: {
  params: ProductsSearchParams;
  facets: ProductsFacets;
  onNavigate: (updates: Partial<ProductsSearchParams>) => void;
  onCloseSheet?: () => void;
}) {
  const [searchInput, setSearchInput] = useState(params.q ?? "");
  const [minPriceInput, setMinPriceInput] = useState(
    params.minPrice != null ? String(params.minPrice) : ""
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    params.maxPrice != null ? String(params.maxPrice) : ""
  );
  const [visibleColorCount, setVisibleColorCount] = useState(5);

  // Sync search input from URL when params change (e.g. back navigation)
  useEffect(() => {
    setSearchInput(params.q ?? "");
  }, [params.q]);

  // Reset visible color count when color list changes (e.g. category change)
  useEffect(() => {
    setVisibleColorCount(5);
  }, [facets.colors.length]);

  // Debounced search: apply q to URL after user stops typing (400ms).
  // Use refs so we don't re-run effect when onNavigate/params change (which would cause repeated requests).
  const onNavigateRef = useRef(onNavigate);
  const paramsQRef = useRef(params.q);
  onNavigateRef.current = onNavigate;
  paramsQRef.current = params.q;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const value = searchInput.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const currentQ = paramsQRef.current?.trim() ?? "";
      if (value === currentQ) return;
      onNavigateRef.current({ q: value || undefined });
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const applySearch = useCallback(() => {
    onNavigate({ q: searchInput.trim() || undefined });
    onCloseSheet?.();
  }, [searchInput, onNavigate, onCloseSheet]);

  const applyPrice = useCallback(() => {
    const min = minPriceInput.trim() ? Number(minPriceInput) : undefined;
    const max = maxPriceInput.trim() ? Number(maxPriceInput) : undefined;
    onNavigate({
      minPrice: min != null && Number.isFinite(min) ? min : undefined,
      maxPrice: max != null && Number.isFinite(max) ? max : undefined,
    });
    onCloseSheet?.();
  }, [minPriceInput, maxPriceInput, onNavigate, onCloseSheet]);

  const toggleColor = useCallback(
    (color: string) => {
      const current = params.color ?? [];
      const next = current.includes(color)
        ? current.filter((c) => c !== color)
        : [...current, color];
      onNavigate({ color: next.length ? next : undefined });
    },
    [params.color, onNavigate]
  );

  const toggleSize = useCallback(
    (size: string) => {
      const current = params.size ?? [];
      const next = current.includes(size)
        ? current.filter((s) => s !== size)
        : [...current, size];
      onNavigate({ size: next.length ? next : undefined });
    },
    [params.size, onNavigate]
  );

  const toggleBrand = useCallback(
    (slug: string) => {
      const current = params.brand ?? [];
      const next = current.includes(slug)
        ? current.filter((b) => b !== slug)
        : [...current, slug];
      onNavigate({ brand: next.length ? next : undefined });
    },
    [params.brand, onNavigate]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <FilterSection title="Search">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applySearch();
          }}
        >
          <Input
            type="search"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full"
          />
        </form>
      </FilterSection>

      {/* Sort */}
      <FilterSection title="Sort">
        <select
          value={params.sort ?? "new"}
          onChange={(e) => {
            const v = e.target.value as ProductsSearchParams["sort"];
            onNavigate({ sort: v });
            onCloseSheet?.();
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* Price */}
      <FilterSection title="Price">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={facets.minPrice}
            max={facets.maxPrice}
            placeholder="Min"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            className="w-24"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min={facets.minPrice}
            max={facets.maxPrice}
            placeholder="Max"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            className="w-24"
          />
          <Button type="button" variant="outline" size="sm" onClick={applyPrice} className="text-foreground shrink-0">
            Apply
          </Button>
        </div>
      </FilterSection>

      {/* Color — show first 5, then +5 per "Show more" click */}
      {facets.colors.length > 0 && (
        <FilterSection title="Color">
          <ul className="space-y-1.5">
            {facets.colors.slice(0, visibleColorCount).map((color) => {
              const isSelected = (params.color ?? []).includes(color);
              return (
                <li key={color}>
                  <button
                    type="button"
                    onClick={() => toggleColor(color)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition",
                      "hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected && "bg-muted"
                    )}
                  >
                    <span
                      className="h-5 w-5 shrink-0 rounded-full border border-neutral/20 shadow-sm ring-1 ring-black/5"
                      style={{ backgroundColor: getColorSwatchValue(color) }}
                      aria-hidden
                    />
                    <span className="flex-1 capitalize text-primary">{getColorDisplayName(color)}</span>
                    <span
                      className={cn(
                        "h-4 w-4 shrink-0 rounded border flex items-center justify-center transition",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background"
                      )}
                      aria-hidden
                    >
                      {isSelected ? (
                        <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 12 12" aria-hidden>
                          <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                        </svg>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 flex flex-col gap-1">
            {visibleColorCount < facets.colors.length && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-primary hover:bg-muted/80"
                onClick={() => setVisibleColorCount((c) => Math.min(c + 5, facets.colors.length))}
              >
                Show more
              </Button>
            )}
            {visibleColorCount > 5 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-primary hover:bg-muted/80"
                onClick={() => setVisibleColorCount(5)}
              >
                Show less
              </Button>
            )}
          </div>
        </FilterSection>
      )}

      {/* Size */}
      {facets.sizes.length > 0 && (
        <FilterSection title="Size">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition",
                  (params.size ?? []).includes(size)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Brand */}
      {facets.brands.length > 0 && (
        <FilterSection title="Brand">
          <div className="flex flex-wrap gap-2">
            {facets.brands.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => toggleBrand(b.slug)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition",
                  (params.brand ?? []).includes(b.slug)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {b.name}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Rating */}
      {facets.ratingBuckets.length > 0 && (
        <FilterSection title="Rating">
          <div className="flex flex-wrap gap-2">
            {facets.ratingBuckets.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  onNavigate({
                    minRating: params.minRating === r ? undefined : r,
                  });
                  onCloseSheet?.();
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition",
                  params.minRating === r
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {r} & up
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Trending */}
      {facets.hasTrending && (
        <FilterSection title="Trending">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={params.trending ?? false}
              onChange={(e) => {
                onNavigate({ trending: e.target.checked });
                onCloseSheet?.();
              }}
              className="rounded border-input"
            />
            <span className="text-sm">Trending</span>
          </label>
        </FilterSection>
      )}

      {/* Sale */}
      {facets.hasSale && (
        <FilterSection title="Sale">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={params.sale ?? false}
              onChange={(e) => {
                onNavigate({ sale: e.target.checked });
                onCloseSheet?.();
              }}
              className="rounded border-input"
            />
            <span className="text-sm">On sale</span>
          </label>
        </FilterSection>
      )}
    </div>
  );
}

export function ProductsFiltersSidebar({
  params,
  facets,
  children,
}: {
  params: ProductsSearchParams;
  facets: ProductsFacets;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname?.split("?")[0] ?? "/products";

  const onNavigate = useCallback(
    (updates: Partial<ProductsSearchParams>) => {
      const query = buildProductsSearchString(params, updates);
      router.push(`${basePath}${query}`);
    },
    [params, basePath, router]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Desktop: sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 space-y-6">
          <FilterFormContent params={params} facets={facets} onNavigate={onNavigate} />
        </div>
      </aside>

      {/* Mobile: Filters + Sort bar and Sheet */}
      <div className="lg:hidden space-y-4">
        <div className="flex items-center gap-2">
          <ProductsFiltersSheet
            params={params}
            facets={facets}
            onNavigate={onNavigate}
          />
          <SortSelectMobile params={params} onNavigate={onNavigate} />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function SortSelectMobile({
  params,
  onNavigate,
}: {
  params: ProductsSearchParams;
  onNavigate: (u: Partial<ProductsSearchParams>) => void;
}) {
  return (
    <select
      value={params.sort ?? "new"}
      onChange={(e) => {
        const v = e.target.value as ProductsSearchParams["sort"];
        onNavigate({ sort: v });
      }}
      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function ProductsFiltersSheet({
  params,
  facets,
  onNavigate,
}: {
  params: ProductsSearchParams;
  facets: ProductsFacets;
  onNavigate: (u: Partial<ProductsSearchParams>) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontalIcon className="size-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <FilterFormContent
            params={params}
            facets={facets}
            onNavigate={onNavigate}
            onCloseSheet={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

