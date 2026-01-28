import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ error: "Missing email or OTP" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.isVerified) {
            return NextResponse.json({ error: "User already verified" }, { status: 400 });
        }

        if (user.otpCode !== otp) {
            return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
        }

        if (user.otpExpires && user.otpExpires < new Date()) {
            return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
        }

        await prisma.user.update({
            where: { email },
            data: {
                isVerified: true,
                otpCode: null,
                otpExpires: null,
            },
        });

        return NextResponse.json({ message: "Email verified successfully" });
    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
