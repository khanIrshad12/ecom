import { Component } from "@/components/ui/lumina-interactive-list";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DemoLuminaPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative">
        <Link
          href="/demo"
          className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-md bg-black/50 px-3 py-2 text-sm text-white hover:bg-black/70"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Demos
        </Link>
        <Component />
      </div>
    </div>
  );
}
