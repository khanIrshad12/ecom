import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/navbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { Label } from "@/components/ui/label";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        include: { addresses: true },
    });

    if (!user) redirect("/login");

    return (
        <div className="min-h-screen pb-20 bg-neutral/5">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 mt-12 space-y-8">
                <h1 className="text-4xl font-bold text-primary">Your Account</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Profile Summary */}
                    <Card className="md:col-span-1 bg-background border-neutral/20 shadow-lg h-inner">
                        <CardHeader className="text-center">
                            <div className="w-20 h-20 bg-neutral/10 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-primary">
                                {user.name?.[0]}
                            </div>
                            <h2 className="text-xl font-bold mt-4">{user.name}</h2>
                            <p className="text-secondary/60 text-sm">{user.email}</p>
                        </CardHeader>
                    </Card>

                    {/* Detailed Info */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="bg-background border-neutral/20 shadow-lg">
                            <CardHeader><h3 className="text-lg font-bold">Personal Information</h3></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-neutral/50">Full Name</Label>
                                        <p className="font-medium">{user.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-neutral/50">Phone Number</Label>
                                        <p className="font-medium">{user.phone || "Not set"}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-neutral/50">Registration Status</Label>
                                    <p className="text-green-600 font-bold flex items-center gap-2">
                                        Verified Account
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-background border-neutral/20 shadow-lg">
                            <CardHeader className="flex flex-row justify-between items-center">
                                <h3 className="text-lg font-bold">Shipping Addresses</h3>
                                <button className="text-primary text-sm font-bold hover:underline">+ Add New</button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {user.addresses.length > 0 ? (
                                    user.addresses.map((addr) => (
                                        <div key={addr.id} className="p-4 border border-neutral/10 rounded-xl space-y-1 relative">
                                            {addr.isDefault && <span className="absolute top-4 right-4 text-[10px] bg-primary text-background px-2 py-0.5 rounded-full uppercase font-bold">Default</span>}
                                            <p className="font-bold">{addr.street}</p>
                                            <p className="text-secondary/60 text-sm">{addr.city}, {addr.state} {addr.zip}</p>
                                            <p className="text-secondary/60 text-sm">{addr.country}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-neutral/40 border-2 border-dashed border-neutral/10 rounded-2xl">
                                        No addresses saved yet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
