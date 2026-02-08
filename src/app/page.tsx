import HeroNavOverlay from "@/components/layout/hero-nav-overlay";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import { convertDriveLink } from "@/lib/utils-drive";
import Image from "next/image";
import FAQAccordion from "@/components/home/faq-accordion";
import { ProductCardImage } from "@/components/product/product-card-image";
import RevealWaveShowcase from "@/components/home/reveal-wave-showcase";
import { LuminaInteractiveList } from "@/components/ui/lumina-interactive-list";
import { Shield, Sparkles, ImageIcon } from "lucide-react";
import { SITE_SETTING_KEYS } from "@/lib/site-settings";

export default async function HomePage() {
  const [featuredProducts, rootCategories, allSubcategories, siteSettings, faqsForHome] = await Promise.all([
    prisma.product.findMany({
      take: 8,
      include: { images: true, variants: true, category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.category.findMany({
      where: {
        parentId: { not: null },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, path: true, parentId: true, imageUrl: true, iconUrl: true },
    }),
    getSiteSettings(),
    prisma.faq.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      take: 7,
      select: { id: true, question: true, answer: true },
    }),
  ]);
  const faqItems = faqsForHome.slice(0, 6).map((f) => ({ id: f.id, question: f.question, answer: f.answer }));
  const showSeeAllFaqs = faqsForHome.length > 6;

  const topBarText = siteSettings[SITE_SETTING_KEYS.TOP_BAR_TEXT];
  const promoBarText = siteSettings[SITE_SETTING_KEYS.PROMO_BAR_TEXT]?.trim() || "New Arrivals • Free shipping on orders over ₹500 • Easy returns";
  const promoBarBgColor = siteSettings[SITE_SETTING_KEYS.PROMO_BAR_BG_COLOR]?.trim();
  const isValidHex = (v: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v.trim());
  const promoSectionStyle = promoBarBgColor && isValidHex(promoBarBgColor) ? { backgroundColor: promoBarBgColor } : undefined;
  const promoSectionClass = "text-primary-foreground py-3 px-4 sm:px-10" + (promoSectionStyle ? "" : " bg-primary");

  // Shop by collection: local images only (no Drive/external URLs)
  const isLocalPath = (s: string | undefined) => {
    const v = (s ?? "").trim();
    return v.startsWith("/") && !v.startsWith("//") && !/^https?:\/\//i.test(v) && !v.includes("drive.google.com");
  };
  const shopByCollectionCards = [
    {
      src: isLocalPath(siteSettings[SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_1])
        ? (siteSettings[SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_1] ?? "").trim()
        : "",
      label: siteSettings[SITE_SETTING_KEYS.SHOP_BY_COLLECTION_LABEL_1]?.trim() || "Women",
    },
    {
      src: isLocalPath(siteSettings[SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_2])
        ? (siteSettings[SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_2] ?? "").trim()
        : "",
      label: siteSettings[SITE_SETTING_KEYS.SHOP_BY_COLLECTION_LABEL_2]?.trim() || "Men",
    },
    {
      src: isLocalPath(siteSettings[SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_3])
        ? (siteSettings[SITE_SETTING_KEYS.SHOP_BY_COLLECTION_IMAGE_3] ?? "").trim()
        : "",
      label: siteSettings[SITE_SETTING_KEYS.SHOP_BY_COLLECTION_LABEL_3]?.trim() || "Kids",
    },
  ].filter((c) => c.src);

  console.log("[HomePage] Root categories found:", rootCategories.length);
  console.log("[HomePage] Root categories:", rootCategories.map(c => ({ id: c.id, name: c.name, showInNav: (c as any).showInNav })));

  const childrenByParentId = new Map<string, typeof allSubcategories>();
  allSubcategories.forEach((sub: any) => {
    const pid = sub.parentId;
    if (pid) {
      if (!childrenByParentId.has(pid)) childrenByParentId.set(pid, []);
      childrenByParentId.get(pid)!.push(sub);
    }
  });
  const categories = rootCategories;

  const isHexColor = (value: unknown): value is string =>
    typeof value === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());

  return (
    <div className="min-h-screen bg-background">
      {/* Hero with navbar overlaid (transparent); hides on scroll down, shows on scroll up */}
      <section className="relative w-full min-h-[100vh]">
        <LuminaInteractiveList />
        <HeroNavOverlay topBarText={topBarText} />
      </section>

      {/* Promo bar – text and bg color from admin (Site content) */}
      <section className={promoSectionClass} style={promoSectionStyle}>
        <div className="max-w-7xl mx-auto text-center text-sm font-medium">
          {promoBarText}
        </div>
      </section>

      {/* Reveal Wave showcase – Shop by collection (heading, subtext, 3 cards from admin; images: local path or Drive link) */}
      <RevealWaveShowcase
        heading={siteSettings[SITE_SETTING_KEYS.SHOP_BY_COLLECTION_HEADING]}
        subtext={siteSettings[SITE_SETTING_KEYS.SHOP_BY_COLLECTION_SUBTEXT]}
        cards={shopByCollectionCards.length > 0 ? shopByCollectionCards : undefined}
      />

      {/* Product grid - clean cards with tabs */}
      <section className="py-16 px-4 sm:px-10">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-6 border-b border-neutral/20 pb-2">
              <span className="font-bold text-primary border-b-2 border-primary pb-2 -mb-0.5">New Arrivals</span>
              <Link href="/products" className="text-secondary hover:text-primary font-medium transition">View All</Link>
            </div>
            <Link href="/products" className="group flex items-center gap-1 text-primary font-semibold text-sm">
              View All <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((p: any) => {
              const price = Number(p.variants[0]?.price ?? 0);
              const actualPrice = (p.variants[0] as any)?.actualPrice != null ? Number((p.variants[0] as any).actualPrice) : null;
              const hasDiscount = actualPrice != null && actualPrice > price;
              const colors = [...new Set((p.variants || []).map((v: any) => v?.color).filter(Boolean))].slice(0, 5);
              return (
                <Link key={p.id} href={`/product/${p.slug}`} className="group block">
                  <ProductCardImage
                    src={p.images[0] ? convertDriveLink(p.images[0].driveUrl) : ""}
                    alt={p.name}
                    useRevealEffect={!!p.images[0]}
                  >
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 z-1 px-2 py-0.5 rounded bg-red-500/90 text-white text-[10px] font-bold uppercase">
                        Sale
                      </span>
                    )}
                  </ProductCardImage>
                  <div className="mt-3 space-y-1">
                    <h3 className="font-semibold text-primary text-sm sm:text-base line-clamp-2 group-hover:underline">
                      {p.name}
                    </h3>
                    <p className="text-primary font-medium">₹{Math.round(price)}</p>
                    {colors.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {colors.slice(0, 4).map((c: string, i: number) =>
                          isHexColor(c) ? (
                            <span
                              key={i}
                              className="w-4 h-4 rounded-full border border-neutral/30 shrink-0"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ) : (
                            <span key={i} className="w-4 h-4 rounded-full border border-neutral/30 bg-neutral/20 text-[10px] flex items-center justify-center truncate max-w-[1rem]" title={c} />
                          )
                        )}
                      </div>
                    )}
                    <p className="text-secondary/70 text-xs">{p.category.name}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature section - Explore Trendy (dynamic from admin) */}
      <section className="py-20 px-4 sm:px-10 bg-neutral/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-[4/5] max-h-[600px] overflow-hidden rounded-xl bg-neutral/10">
              {(() => {
                const imgPath = siteSettings[SITE_SETTING_KEYS.EXPLORE_TRENDY_IMAGE]?.trim();
                const useImg = imgPath && isLocalPath(imgPath);
                const src = useImg ? imgPath : "/images/Men/explore_trend.jpg";
                return (
                  <>
                    <Image
                      width="0"
                      height="0"
                      sizes="100vw"
                      src={src}
                      alt="Fashion"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
                  </>
                );
              })()}
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
                {siteSettings[SITE_SETTING_KEYS.EXPLORE_TRENDY_HEADING]?.trim() || "Explore Trendy Styles And Elevate Your Fashion Game!"}
              </h2>
              <p className="text-secondary leading-relaxed max-w-lg">
                {siteSettings[SITE_SETTING_KEYS.EXPLORE_TRENDY_SUBTEXT]?.trim() ||
                  "Discover curated collections that blend quality with affordability. From everyday essentials to statement pieces, find something that fits your vibe."}
              </p>
              <Link href="/products">
                <Button size="lg" className="h-12 px-8 font-semibold rounded-sm">
                  Shop Now
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="flex gap-4 p-6 rounded-xl bg-background border border-neutral/10">
              <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-primary mb-1">
                  {siteSettings[SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD1_TITLE]?.trim() || "Secure Shopping"}
                </h3>
                <p className="text-secondary text-sm">
                  {siteSettings[SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD1_DESC]?.trim() || "Safe checkout and protected payments."}
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-6 rounded-xl bg-background border border-neutral/10">
              <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-primary mb-1">
                  {siteSettings[SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD2_TITLE]?.trim() || "Curated Picks"}
                </h3>
                <p className="text-secondary text-sm">
                  {siteSettings[SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD2_DESC]?.trim() || "Personalized recommendations for you."}
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-6 rounded-xl bg-background border border-neutral/10">
              <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-primary mb-1">
                  {siteSettings[SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD3_TITLE]?.trim() || "Quality Imagery"}
                </h3>
                <p className="text-secondary text-sm">
                  {siteSettings[SITE_SETTING_KEYS.EXPLORE_TRENDY_CARD3_DESC]?.trim() || "High-quality product photos and details."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-4 sm:px-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-primary mb-8">What Our Customers Say</h2>
          <div className="flex justify-center gap-1 mb-6 text-amber-500">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="text-xl">★</span>
            ))}
          </div>
          <blockquote className="text-xl md:text-2xl text-primary font-medium leading-relaxed mb-6">
            &ldquo;Great quality and fast shipping. Will definitely order again!&rdquo;
          </blockquote>
          <p className="text-secondary font-semibold">— Happy Customer</p>
        </div>
      </section>

      {/* Shop By Category - gradient overlay top & bottom */}
      <section className="py-24 px-4 sm:px-10 bg-neutral/5 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-primary/10 pb-8">
          <h2 className="text-3xl font-bold text-primary tracking-tight">Shop By Category</h2>
          <p className="text-secondary/70">Find your vibe in our curated sections</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat: any) => {
            const children = childrenByParentId.get(cat.id) ?? [];
            const catHref = `/products?categoryId=${encodeURIComponent(cat.id)}`;
            const catImg = cat.imageUrl ? convertDriveLink(cat.imageUrl) : "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070";
            return (
              <div key={cat.id} className="space-y-4">
                <Link href={catHref} className="group relative h-[420px] block overflow-hidden rounded-xl bg-neutral/10">
                  <Image
                  width="0"
                  height="0"
                  sizes="100vw"
                    src={catImg}
                    alt={cat.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <h3 className="text-2xl font-bold text-white">{cat.name}</h3>
                    <span className="text-white/80 text-sm font-medium mt-1">Shop Now →</span>
                  </div>
                </Link>
                {children.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {children.map((sub: any) => {
                      const subHref = `/products?categoryId=${encodeURIComponent(sub.id)}`;
                      const subImg = (sub.imageUrl || sub.iconUrl) ? convertDriveLink(sub.imageUrl || sub.iconUrl) : "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=200";
                      return (
                        <Link
                          key={sub.id}
                          href={subHref}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral/20 bg-background hover:bg-neutral/10 text-sm font-medium text-primary transition"
                        >
                          <span className="shrink-0 w-8 h-8 rounded overflow-hidden border border-neutral/20 bg-muted/50">
                            <Image
                              width="0"
                              height="0"
                              sizes="100vw"
                              src={subImg}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </span>
                          <span className="truncate">{sub.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ (dynamic from admin; first 6 on homepage, See all if >6) */}
      <section className="py-20 px-4 sm:px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-primary tracking-tight">
              {siteSettings[SITE_SETTING_KEYS.FAQ_HEADING]?.trim() || "Frequently Asked Questions"}
            </h2>
            <p className="text-secondary max-w-md">
              {siteSettings[SITE_SETTING_KEYS.FAQ_SUBTEXT]?.trim() ||
                "Quick answers to common questions about shipping, returns, and more."}
            </p>
            {showSeeAllFaqs && (
              <Link href="/faq">
                <Button variant="outline" className="mt-4 rounded-sm">See all FAQs</Button>
              </Link>
            )}
          </div>
          <div>
            <FAQAccordion items={faqItems.length > 0 ? faqItems : undefined} />
          </div>
        </div>
      </section>

      {/* Exclusive CTA (dynamic from admin) */}
      <section className="py-20 px-4 sm:px-10 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {siteSettings[SITE_SETTING_KEYS.EXCLUSIVE_CTA_HEADING]?.trim() || "Shop Now For Exclusive Styles!"}
            </h2>
            <p className="text-primary-foreground/80 max-w-lg leading-relaxed">
              {siteSettings[SITE_SETTING_KEYS.EXCLUSIVE_CTA_SUBTEXT]?.trim() ||
                "Discover our latest collection. Quality fabrics, on-trend designs, and prices that don't break the bank."}
            </p>
            <Link
              href={
                (() => {
                  const raw = siteSettings[SITE_SETTING_KEYS.EXCLUSIVE_CTA_BTN_LINK]?.trim();
                  if (raw && (raw.startsWith("/") || raw.startsWith("http"))) return raw;
                  return "/products";
                })()
              }
            >
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-12 px-8 font-semibold rounded-sm">
                {siteSettings[SITE_SETTING_KEYS.EXCLUSIVE_CTA_BTN_TEXT]?.trim() || "Shop Now"}
              </Button>
            </Link>
          </div>
          <div className="relative aspect-[4/5] max-h-[500px] overflow-hidden rounded-xl">
            {(() => {
              const imgPath = siteSettings[SITE_SETTING_KEYS.EXCLUSIVE_CTA_IMAGE]?.trim();
              const useImg = imgPath && isLocalPath(imgPath);
              const src = useImg ? imgPath : "/images/Women/exclusive_style.jpg";
              return (
                <>
                  <Image
                    width="0"
                    height="0"
                    sizes="100vw"
                    src={src}
                    alt="Exclusive styles"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 px-4 sm:px-10 bg-neutral/5 text-center space-y-6">
        <h2 className="text-3xl font-bold text-primary tracking-tight">Join The Club</h2>
        <p className="text-secondary max-w-md mx-auto">Get early access to drops, exclusive discounts, and fashion insights.</p>
        <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-3 justify-center">
          <Input placeholder="Email address" className="h-12 rounded-sm border-neutral/30 bg-background" />
          <Button className="h-12 px-8 font-semibold rounded-sm">Join</Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
