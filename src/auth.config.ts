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
                token.name = user.name;
                token.role = user.role;
                token.status = user.status;
                token.assemblyId = user.assemblyId;
                token.assemblyName = user.assemblyName;
                token.assemblyNumber = user.assemblyNumber;
                token.campaignId = user.campaignId;
                token.image = user.image;
                token.workerId = user.workerId;
                token.workerType = user.workerType;
                token.boothId = user.boothId;
                token.boothNumber = user.boothNumber;
                token.lastRefreshed = Date.now();
                return token;
            }

            // If trigger is 'update', update the token (provided by client-side session update)
            if (trigger === "update" && session) {
                token.role = session.role || session.user?.role || token.role;
                token.status = session.status || session.user?.status || token.status;
                token.assemblyId = session.assemblyId || session.user?.assemblyId || token.assemblyId;
                token.assemblyName = session.assemblyName || session.user?.assemblyName || token.assemblyName;
                token.assemblyNumber = session.assemblyNumber || session.user?.assemblyNumber || token.assemblyNumber;
                token.campaignId = session.campaignId || session.user?.campaignId || token.campaignId;
                token.name = session.name || session.user?.name || token.name;
                token.image = session.image || session.user?.image || token.image;
                // Allow workerType to be refreshed via update trigger
                if (session.workerType !== undefined || session.user?.workerType !== undefined) {
                    token.workerType = session.workerType ?? session.user?.workerType;
                }
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
                session.user.assemblyName = token.assemblyName as string | null | undefined;
                session.user.assemblyNumber = token.assemblyNumber as number | null | undefined;
                session.user.campaignId = token.campaignId as number | null;
                session.user.workerId = token.workerId as number | undefined;
                session.user.workerType = token.workerType as string | undefined;
                session.user.boothId = token.boothId as number | undefined;
                session.user.boothNumber = token.boothNumber as number | undefined;
                session.user.image = token.image as string | null | undefined;
                session.user.name = token.name as string | null | undefined;
            }
            return session;
        },
        authorized({ auth }) {
            return !!auth?.user;
        },
    },
} satisfies NextAuthConfig;
