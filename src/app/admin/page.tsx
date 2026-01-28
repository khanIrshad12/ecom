import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
    const session = await auth();

    // Extra safety check in case middleware is bypassed
    if (session?.user?.role !== "ADMIN") {
        redirect("/");
    }

    const [productCount, categoryCount, userCount] = await Promise.all([
        prisma.product.count(),
        prisma.category.count(),
        prisma.user.count(),
    ]);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-background border-neutral/20 shadow-md">
                    <CardHeader>
                        <h3 className="text-sm font-medium text-secondary uppercase tracking-wider">Total Products</h3>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-primary">{productCount}</p>
                    </CardContent>
                </Card>

                <Card className="bg-background border-neutral/20 shadow-md">
                    <CardHeader>
                        <h3 className="text-sm font-medium text-secondary uppercase tracking-wider">Categories</h3>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-primary">{categoryCount}</p>
                    </CardContent>
                </Card>

                <Card className="bg-background border-neutral/20 shadow-md">
                    <CardHeader>
                        <h3 className="text-sm font-medium text-secondary uppercase tracking-wider">Total Users</h3>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-primary">{userCount}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="p-8 border-2 border-dashed border-neutral/20 rounded-2xl text-center space-y-4">
                <h2 className="text-xl font-bold text-primary">Quick Actions</h2>
                <div className="flex justify-center gap-4">
                    {/* Add buttons or links to other admin pages if needed */}
                </div>
            </div>
        </div>
    );
}
