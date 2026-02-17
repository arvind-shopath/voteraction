import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    providers: [], // Defined in auth.ts to avoid Edge issues
    pages: {
        signIn: "/",
        error: "/",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }: any) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.status = user.status;
                token.assemblyId = user.assemblyId;
                token.campaignId = user.campaignId;
            }

            // If trigger is 'update', update the token (provided by client-side session update)
            if (trigger === "update" && session) {
                token.role = session.user?.role || token.role;
                token.status = session.user?.status || token.status;
                token.assemblyId = session.user?.assemblyId || token.assemblyId;
                token.campaignId = session.user?.campaignId || token.campaignId;
            }

            return token;
        },
        async session({ session, token }: any) {
            if (token && session.user) {
                session.user.id = token.id as string;
                // Normalize legacy role for transition
                const rawRole = token.role as string;
                session.user.role = rawRole === 'MANAGER' ? 'CANDIDATE' : rawRole;
                session.user.status = token.status as string;
                session.user.assemblyId = token.assemblyId as number | null;
                session.user.campaignId = token.campaignId as number | null;
                session.user.workerId = token.workerId as number | undefined;
                session.user.workerType = token.workerType as string | undefined;
            }
            return session;
        },
        authorized({ auth }) {
            return !!auth?.user;
        },
    },
} satisfies NextAuthConfig;
