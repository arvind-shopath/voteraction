'use server';

import { prisma as prismaClient } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const prisma = prismaClient as any;

export async function saveSocialSession(data: {
    platform: string,
    candidateId: number,
    sessionData: string, // Encrypted
    userId: number
}) {
    await prisma.socialSession.upsert({
        where: {
            platform_candidateId: {
                platform: data.platform.toUpperCase(),
                candidateId: data.candidateId
            }
        },
        update: {
            sessionData: data.sessionData,
            updatedBy: data.userId
        },
        create: {
            platform: data.platform.toUpperCase(),
            candidateId: data.candidateId,
            sessionData: data.sessionData,
            updatedBy: data.userId
        }
    });

    revalidatePath('/social-sena');
    return { success: true };
}

export async function getSocialSession(platform: string, candidateId: number) {
    return await prisma.socialSession.findUnique({
        where: {
            platform_candidateId: {
                platform: platform.toUpperCase(),
                candidateId: candidateId
            }
        }
    });
}

export async function lockSocialSession(platform: string, candidateIdRaw: any, userIdRaw: any) {
    const platformUpper = platform.toUpperCase();
    const candidateId = candidateIdRaw ? parseInt(candidateIdRaw.toString()) : 0;
    const userId = userIdRaw ? parseInt(userIdRaw.toString()) : 0;

    if (!candidateId || isNaN(candidateId)) {
        return { success: false, message: "कैंडिडेट आईडी अमान्य है।" };
    }
    if (!userId || isNaN(userId)) {
        return { success: false, message: "यूजर लॉगिन अमान्य है। कृपया पुनः लॉगिन करें।" };
    }

    // Check if already locked by someone else
    const existing = await prisma.socialSession.findUnique({
        where: { platform_candidateId: { platform: platformUpper, candidateId } }
    });

    if (existing?.lockedById && existing.lockedById !== userId) {
        // If locked more than 30 mins ago, we can break the lock (stale session)
        const staleTime = new Date(Date.now() - 30 * 60 * 1000);
        const lockedAtDate = new Date(existing.lockedAt);
        if (lockedAtDate > staleTime) {
            const locker = await prisma.user.findUnique({ where: { id: existing.lockedById }, select: { name: true } });
            return {
                success: false,
                message: `यह अकाउंट वर्तमान में "${locker?.name || 'अन्य यूजर'}" द्वारा उपयोग किया जा रहा है। सुरक्षा कारणों से एक समय में एक ही व्यक्ति इसे चला सकता है।`
            };
        }
    }

    await prisma.socialSession.upsert({
        where: { platform_candidateId: { platform: platformUpper, candidateId } },
        update: {
            lockedById: userId,
            lockedAt: new Date()
        },
        create: {
            platform: platformUpper,
            candidateId,
            sessionData: "{}", // Default empty session
            updatedBy: userId,
            lockedById: userId,
            lockedAt: new Date()
        }
    });

    // Re-fetch to get the session data for auto-login
    const session = await prisma.socialSession.findUnique({
        where: { platform_candidateId: { platform: platformUpper, candidateId } }
    });

    return { success: true, sessionData: session?.sessionData };
}

export async function unlockSocialSession(platform: string, candidateId: number, userId: number) {
    const platformUpper = platform.toUpperCase();
    await prisma.socialSession.update({
        where: { platform_candidateId: { platform: platformUpper, candidateId } },
        data: {
            lockedById: null,
            lockedAt: null
        }
    });
    return { success: true };
}
