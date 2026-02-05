"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Suspense } from "react";

const RevealWaveImage = dynamic(
  () => import("@/components/ui/reveal-wave-image").then((m) => m.RevealWaveImage),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-neutral/10 animate-pulse rounded-xl" />,
  }
);

const CLOTH_IMAGES = [
  {
    src: "/images/Women/women_collection.jpg  ",
    label: "Women",
  },
  {
    src: "/images/Men/men_collection.avif",
    label: "Men",
  },
  {
    src: "/images/kids/kids_collection.avif",
    label: "Kids",
  },
];

function ImageCard({ src, label }: { src: string; label: string }) {
  return (
    <div className="group relative rounded-xl overflow-hidden border border-neutral/15 shadow-[25px_20px_30px_rgba(189,132,77,0.18),15px_30px_30px_rgba(189,132,77,0.12)] hover:shadow-[0_12px_40px_rgba(189,132,77,0.22),0_6px_16px_rgba(189,132,77,0.14)] transition-shadow duration-300">
      <div className="aspect-3/4 relative bg-neutral/10">
        <Suspense fallback={<div className="w-full h-full bg-neutral/10 animate-pulse" />}>
          <RevealWaveImage
            src={src}
            className="w-full h-full"
            waveSpeed={0.25}
            waveFrequency={1.8}
            waveAmplitude={0.15}
            revealRadius={0.4}
            revealSoftness={0.6}
            pixelSize={2.5}
            mouseRadius={0.3}
          />
        </Suspense>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/70 to-transparent">
        <span className="text-white font-semibold text-sm uppercase tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
}

export default function RevealWaveShowcase() {
  return (
    <section className="py-16 px-4 sm:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-primary tracking-tight mb-2">
            Shop by collection
          </h2>
          <p className="text-secondary/80 text-sm md:text-base max-w-lg mx-auto">
            Explore our curated styles for Women, Men & Kids. Hover over each image to reveal the full look—premium quality, timeless pieces for every wardrobe.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CLOTH_IMAGES.map((item) => (
            <ImageCard key={item.label} src={item.src} label={item.label} />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/products">
            <Button variant="outline" className="rounded-sm">
              Shop all
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
