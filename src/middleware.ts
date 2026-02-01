import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { nextUrl } = req;

    const isAppPath = nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/voters") ||
        nextUrl.pathname.startsWith("/workers") ||
        nextUrl.pathname.startsWith("/admin") ||
        nextUrl.pathname.startsWith("/booths") ||
        nextUrl.pathname.startsWith("/issues") ||
        nextUrl.pathname.startsWith("/reports");

    if (isAppPath) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL("/", nextUrl));
        }

        const userStatus = (req.auth?.user as any)?.status;
        const userRole = (req.auth?.user as any)?.role;

        // If not active, redirect to pending page
        if (userStatus !== "Active") {
            return NextResponse.redirect(new URL("/pending", nextUrl));
        }

        // If active but no assembly assigned, still pending assembly
        if (!userRole || (userRole !== "ADMIN" && userRole !== "SUPERADMIN" && !(req.auth?.user as any)?.assemblyId)) {
            return NextResponse.redirect(new URL("/pending-assembly", nextUrl));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
