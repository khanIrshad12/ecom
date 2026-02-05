"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

const RevealWaveImage = dynamic(
  () => import("@/components/ui/reveal-wave-image").then((m) => m.RevealWaveImage),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-neutral/10 animate-pulse rounded-lg" />
    ),
  }
);

function isCorsBlockedForWebGl(url: string): boolean {
  return /google\.com|drive\.|usercontent\.google/.test(url);
}

type ProductCardImageProps = {
  src: string;
  alt: string;
  useRevealEffect?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function ProductCardImage({
  src,
  alt,
  useRevealEffect = true,
  className = "",
  children,
}: ProductCardImageProps) {
  const containerClass = `aspect-[3/4] overflow-hidden rounded-lg bg-neutral/5 relative shadow-sm group-hover:shadow-md transition-shadow ${className}`;
  const useEffect = useRevealEffect && src && !isCorsBlockedForWebGl(src);

  if (useEffect) {
    return (
      <div className={containerClass}>
        <RevealWaveImage
          src={src}
          className="absolute inset-0 w-full h-full"
          waveSpeed={0.3}
          waveFrequency={2}
          waveAmplitude={0.15}
          revealRadius={0.35}
          revealSoftness={0.6}
          pixelSize={2.5}
          mouseRadius={0.25}
        />
        {children}
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <Image
        width={400}
        height={533}
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {children}
    </div>
  );
}
