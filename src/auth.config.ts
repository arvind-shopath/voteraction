import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authConfig = {
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                mobile: { label: "Mobile", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.mobile || !credentials?.password) return null;

                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { mobile: credentials.mobile as string },
                            { username: credentials.mobile as string }
                        ]
                    }
                });

                if (!user || !user.password) return null;

                const isValid = await bcrypt.compare(credentials.password as string, user.password);

                if (isValid) {
                    return { ...user, id: user.id.toString() };
                }
                return null;
            }
        })
    ],
    pages: {
        signIn: "/",
        error: "/",
    },
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.status = (user as any).status;
                token.assemblyId = (user as any).assemblyId;
                token.campaignId = (user as any).campaignId;

                // Get worker details if user is a WORKER
                if ((user as any).role === 'WORKER') {
                    const worker = await prisma.worker.findUnique({
                        where: { userId: parseInt(user.id) },
                        select: { id: true, type: true }
                    });
                    if (worker) {
                        token.workerId = worker.id;
                        token.workerType = worker.type; // BOOTH_MANAGER, PANNA_PRAMUKH, FIELD
                    }
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
