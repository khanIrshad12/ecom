import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { nextUrl } = req;
    const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
    const isAdminRoute = nextUrl.pathname.startsWith("/admin");
    const isAuthRoute = ["/login", "/register"].includes(nextUrl.pathname);

    // console.log("Middleware Debug:", {
    //     pathname: nextUrl.pathname,
    //     isLoggedIn,
    //     role: req.auth?.user?.role
    // });

    if (isApiAuthRoute) return NextResponse.next();

    if (isAdminRoute) {
        if (!isLoggedIn) {
            const callbackUrl = nextUrl.pathname + nextUrl.search;
            return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, nextUrl));
        }

        if ((req.auth?.user as any)?.role !== "ADMIN") {
            console.warn("ADMIN Access Blocked: User is not an ADMIN", req.auth?.user);
            return NextResponse.redirect(new URL("/", nextUrl));
        }
    }

    if (isAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL("/", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
