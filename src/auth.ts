import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma as any),
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
                    return {
                        id: user.id.toString(),
                        role: user.role,
                        status: user.status,
                        assemblyId: user.assemblyId,
                        campaignId: user.campaignId,
                        name: user.name,
                        mobile: user.mobile
                    } as any;
                }
                return null;
            }
        })
    ],
    session: { strategy: "jwt" },
    trustHost: true,
});
