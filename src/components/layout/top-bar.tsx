import Link from "next/link";
import { Instagram, Facebook, Twitter } from "lucide-react";

export default function TopBar() {
  return (
    <div className="bg-primary text-primary-foreground text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-9">
          <p className="font-medium">
            Free shipping on orders over ₹500
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="opacity-80 hover:opacity-100 transition" aria-label="Instagram">
              <Instagram className="w-4 h-4" />
            </Link>
            <Link href="#" className="opacity-80 hover:opacity-100 transition" aria-label="Facebook">
              <Facebook className="w-4 h-4" />
            </Link>
            <Link href="#" className="opacity-80 hover:opacity-100 transition" aria-label="Twitter">
              <Twitter className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
