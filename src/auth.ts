import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

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
                    },
                    include: { assembly: true }
                });

                if (!user || !user.password) return null;

                const isValid = await bcrypt.compare(credentials.password as string, user.password);

                if (isValid) {
                    // Fetch worker details if the user is a worker
                    const worker = await prisma.worker.findUnique({
                        where: { userId: user.id },
                        include: { booth: true }
                    });

                    return {
                        id: user.id.toString(),
                        role: user.role,
                        status: user.status,
                        assemblyId: user.assemblyId,
                        assemblyName: user.assembly?.nameHindi || user.assembly?.name || null,
                        assemblyNumber: user.assembly?.number || null,
                        campaignId: user.campaignId,
                        name: user.name,
                        mobile: user.mobile,
                        image: user.image,
                        workerId: worker?.id,
                        workerType: worker?.type,
                        boothId: worker?.boothId,
                        boothNumber: worker?.booth?.number
                    } as any;
                }
                return null;
            }
        })
    ],
    session: { strategy: "jwt" },
    trustHost: true,
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user, trigger, session }: any) {
            // Run base config jwt first
            const baseResult = await (authConfig.callbacks as any).jwt({ token, user, trigger, session });

            if (baseResult.assemblyId && !baseResult.assemblyName) {
                try {
                    const assembly = await prisma.assembly.findUnique({
                        where: { id: baseResult.assemblyId },
                        select: { name: true, nameHindi: true, number: true }
                    });
                    if (assembly) {
                        baseResult.assemblyName = assembly.nameHindi || assembly.name;
                        baseResult.assemblyNumber = assembly.number;
                    }
                } catch (e) {
                    // Silently fail
                }
            }

            // Periodic DB refresh for WORKERs to catch role changes (every 5 min)
            // This runs in Node.js context (auth.ts), so Prisma is safe here
            const now = Date.now();
            const lastRefreshed = baseResult.lastRefreshed || 0;
            const shouldRefresh = !user && baseResult.role === 'WORKER' && (now - lastRefreshed) > REFRESH_INTERVAL;

            if (shouldRefresh && baseResult.id) {
                try {
                    const worker = await prisma.worker.findUnique({
                        where: { userId: parseInt(baseResult.id as string) },
                        include: { booth: true }
                    });
                    if (worker) {
                        baseResult.workerId = worker.id;
                        baseResult.workerType = worker.type;
                        baseResult.boothId = worker.boothId;
                        baseResult.boothNumber = worker.booth?.number;
                    }
                    baseResult.lastRefreshed = now;
                } catch (e) {
                    // Silently fail — use cached token data
                }
            }

            return baseResult;
        }
    }
});
