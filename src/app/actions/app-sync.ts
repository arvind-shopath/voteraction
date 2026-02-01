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

    revalidatePath('/social-team');
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
