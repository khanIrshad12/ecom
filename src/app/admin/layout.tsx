import Link from "next/link";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r border-neutral/20 p-6 flex flex-col space-y-4">
                <h2 className="text-2xl font-bold text-primary mb-6">Admin Panel</h2>
                <nav className="flex flex-col space-y-2">
                    <Link href="/admin" className="p-2 hover:bg-neutral/10 rounded transition">
                        Dashboard
                    </Link>
                    <Link href="/admin/categories" className="p-2 hover:bg-neutral/10 rounded transition">
                        Categories
                    </Link>
                    <Link href="/admin/products" className="p-2 hover:bg-neutral/10 rounded transition">
                        Products
                    </Link>
                    <Link href="/admin/brands" className="p-2 hover:bg-neutral/10 rounded transition">
                        Brands
                    </Link>
                    <Link href="/admin/orders" className="p-2 hover:bg-neutral/10 rounded transition">
                        Orders
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    );
}
