import { RevealWaveImage } from "@/components/ui/reveal-wave-image";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-secondary hover:text-primary mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <h1 className="text-2xl font-bold text-primary mb-2">Reveal Wave Image Demo</h1>
        <p className="text-secondary text-sm mb-8">
          Move your mouse over the image to reveal color. B&W dithering with wave and ripple effect.
        </p>
        <div className="rounded-xl overflow-hidden border border-neutral/20 shadow-lg aspect-[4/3] max-h-[70vh]">
          <RevealWaveImage
            src="https://images.unsplash.com/photo-1761839257469-96c78a7c2dd3?q=80&w=2069&auto=format&fit=crop"
            waveSpeed={0.2}
            waveFrequency={0.7}
            waveAmplitude={0.5}
            revealRadius={0.5}
            revealSoftness={1}
            pixelSize={2}
            mouseRadius={0.4}
            className="w-full h-full"
          />
        </div>
        <div className="mt-8 flex gap-4">
          <Link href="/products">
            <Button variant="outline">View Product Cards</Button>
          </Link>
          <Link href="/">
            <Button>Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
