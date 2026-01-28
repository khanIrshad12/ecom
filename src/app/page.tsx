import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { convertDriveLink } from "@/lib/utils-drive";
import Image from "next/image";

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    prisma.product.findMany({
      take: 8,
      include: { images: true, variants: true, category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { parentId: null },
    })
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section - Sleeker & More Minimal */}
      <section className="relative h-[85vh] flex items-center px-4 sm:px-10 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070"
            alt="Hero Background"
            className="w-full h-full object-cover grayscale brightness-[0.8]"
          />
        </div>
        <div className="relative z-10 max-w-2xl space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="space-y-4">
            <span className="text-accent font-black tracking-[0.3em] uppercase text-sm block">Premium Collection 2026</span>
            <h1 className="text-6xl md:text-8xl font-bold text-background leading-[0.9] tracking-tighter">
              LESS IS <br /> <span className="text-accent underline decoration-4 underline-offset-8">MORE</span>.
            </h1>
          </div>
          <p className="text-[#314158] text-lg md:text-xl font-base max-w-md">
            Curated essentials for the modern generation. High quality fabrics, timeless silhouettes.
          </p>
          <div className="flex gap-4 pt-4">
            <Button size="lg" className="bg-background text-primary hover:bg-[#314158] hover:text-white px-8 h-14 text-md font-bold rounded-none">
              Explore Now
            </Button>
            <Button size="lg" variant="outline" className="border-background text-black bg-background/10 px-8 h-14 text-md font-bold rounded-none">
              Lookbook
            </Button>
          </div>
        </div>
      </section>

      {/* Shop By Category - NEW SECTION */}
      <section className="py-24 px-4 sm:px-10 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-primary/10 pb-8">
          <h2 className="text-4xl font-black text-primary tracking-tighter uppercase italic">Shop By Category</h2>
          <p className="text-secondary/60 font-medium">Find your vibe in our curated sections</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group relative h-[500px] overflow-hidden bg-neutral/10"
            >
              <img
                src={cat.imageUrl ? convertDriveLink(cat.imageUrl) : "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070"}
                alt={cat.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute bottom-8 left-8 space-y-2">
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">{cat.name}</h3>
                <div className="h-1 w-0 group-hover:w-full bg-accent transition-all duration-500" />
                <span className="text-white/60 text-xs font-bold tracking-widest uppercase block pt-2">Shop Now &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals - Sleeker Logic */}
      <section className="bg-primary text-background py-24 px-4 sm:px-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex justify-between items-center">
            <h2 className="text-5xl font-black italic tracking-tighter uppercase">New Arrivals</h2>
            <Link href="/products" className="group flex items-center gap-2 text-accent font-bold">
              View All <span className="group-hover:translate-x-2 transition-transform">&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {featuredProducts.map((p: any) => (
              <Link key={p.id} href={`/product/${p.slug}`} className="group block space-y-6">
                <div className="aspect-3/4 overflow-hidden bg-neutral/20 relative">
                  {p.images[0] && (
                    <Image
                      width="0"
                      height="0"
                      sizes="100vw,100vh"
                      src={convertDriveLink(p.images[0].driveUrl)}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute bottom-0 left-0 w-full p-4 bg-linear-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                    <span className="bg-accent text-primary px-3 py-1 text-xs font-black uppercase">Quick View</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-xl leading-tight">{p.name}</h3>
                    <span className="text-accent font-black">₹{p.variants[0]?.price || 0}</span>
                  </div>
                  <p className="text-background/40 text-xs font-bold uppercase tracking-widest">{p.category.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="py-24 px-4 sm:px-10 bg-accent text-primary text-center space-y-8">
        <h2 className="text-6xl font-black italic tracking-tighter uppercase">Join The Club</h2>
        <p className="max-w-md mx-auto font-medium">Get early access to drops, exclusive discounts, and fashion insights.</p>
        <div className="flex max-w-sm mx-auto gap-2">
          <Input placeholder="EMAIL ADDRESS" className="border-primary h-14 rounded-none placeholder:text-primary/40 font-bold" />
          <Button className="h-14 bg-primary text-background rounded-none px-8 font-black">JOIN</Button>
        </div>
      </section>
    </div>
  );
}
