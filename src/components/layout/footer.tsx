import Link from "next/link";
import { Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="text-2xl font-bold tracking-tighter">
              Make It Yours<span className="text-accent">.</span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Trendy, high-quality fashion at affordable prices. Perfect for any occasion and style.
            </p>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-wider text-sm mb-4">Category</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link href="/products" className="hover:text-primary-foreground transition">All Products</Link></li>
              <li><Link href="/products" className="hover:text-primary-foreground transition">New Arrivals</Link></li>
              <li><Link href="/products" className="hover:text-primary-foreground transition">Sale</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-wider text-sm mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link href="#" className="hover:text-primary-foreground transition">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary-foreground transition">Contact</Link></li>
              <li><Link href="#" className="hover:text-primary-foreground transition">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-wider text-sm mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link href="#" className="hover:text-primary-foreground transition">Help</Link></li>
              <li><Link href="#" className="hover:text-primary-foreground transition">Shipping & Returns</Link></li>
              <li><Link href="/faq" className="hover:text-primary-foreground transition">FAQ</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-primary-foreground/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} Make It Yours. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition" aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition" aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
