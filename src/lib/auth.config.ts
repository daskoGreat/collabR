import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Edge-safe auth config — no DB imports, used by middleware
export const authConfig: NextAuthConfig = {
    secret: process.env.AUTH_SECRET,
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            // authorize is a placeholder here — the real one is in auth.ts
            authorize() {
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as { role: string }).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                (session.user as { role: string }).role = token.role as string;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const { pathname } = nextUrl;

            // Public routes
            const publicRoutes = ["/", "/login", "/invite"];
            const isPublicRoute = publicRoutes.some((route) =>
                pathname === route || (route !== "/" && pathname.startsWith(route + "/"))
            );

            if (pathname.startsWith("/api/auth")) return true;
            if (isPublicRoute) return true;
            if (!isLoggedIn) return false;

            return true;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
};
