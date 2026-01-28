"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

export default function RegisterForm() {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                body: JSON.stringify(form),
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (!res.ok) toast.error(data.error || "Registration failed");
            else {
                toast.success(data.message);
                setStep(2);
            }
        } catch (error) { toast.error("Something went wrong"); }
        finally { setLoading(false); }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/verify-otp", {
                method: "POST",
                body: JSON.stringify({ email: form.email, otp }),
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (!res.ok) toast.error(data.error || "Verification failed");
            else {
                toast.success(data.message);
                router.push("/login");
            }
        } catch (error) { toast.error("Something went wrong"); }
        finally { setLoading(false); }
    };

    return (
        <Card className="w-full max-w-md bg-background border-neutral/20 shadow-xl">
            <CardHeader className="text-center">
                <h1 className="text-3xl font-bold text-primary">{step === 1 ? "Create Account" : "Verify Email"}</h1>
                <p className="text-secondary/70">{step === 1 ? "Join our exclusive store" : "Enter the code sent to your email"}</p>
            </CardHeader>
            <CardContent>
                {step === 1 ? (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" placeholder="+123456789" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending..." : "Register"}</Button>
                    </form>
                ) : (
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp">Code</Label>
                            <Input id="otp" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Verifying..." : "Verify"}</Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
