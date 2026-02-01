'use server';

import { prisma as prismaClient } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const prisma = prismaClient as any;

export async function getJansamparkSupportStats(assemblyId: number) {
    // 1. Fetch Village-wise Support from Voter Feedback (Campaign Specific)
    const voters = await prisma.voter.findMany({
        where: { assemblyId },
        select: {
            village: true,
            supportStatus: true,
        }
    });

    const stats: Record<string, { positive: number, neutral: number, negative: number }> = {};

    voters.forEach((v: any) => {
        const village = v.village || 'अन्य';
        if (!stats[village]) {
            stats[village] = { positive: 0, neutral: 0, negative: 0 };
        }

        if (v.supportStatus === 'Support') stats[village].positive++;
        else if (v.supportStatus === 'Against') stats[village].negative++;
        else stats[village].neutral++;
    });

    return stats;
}

export async function getJansamparkRoutes(assemblyId: number, onlyUnmarked?: boolean) {
    const where: any = { assemblyId };
    if (onlyUnmarked !== undefined) {
        if (onlyUnmarked) {
            // Get only unmarked (posterStatus null or empty)
            where.OR = [
                { posterStatus: null },
                { posterStatus: '' }
            ];
        } else {
            // Get marked ones (posterStatus either MADE or NOT_NEEDED)
            where.posterStatus = { not: null };
        }
    }

    return await prisma.jansamparkRoute.findMany({
        where,
        include: {
            visits: {
                orderBy: { id: 'asc' }
            },
            posterUser: {
                select: { name: true, email: true }
            }
        },
        orderBy: { date: 'desc' }
    });
}

export async function createWorkerJanSampark(data: {
    personName: string,
    mobile?: string,
    village?: string,
    description?: string,
    imageUrl?: string,
    atmosphere?: string,
    workerId: number,
    assemblyId: number,
    voterId?: number
}) {
    await prisma.workerJanSampark.create({ data });
    revalidatePath('/jansampark');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function getWorkerJanSamparks(filters: {
    workerId?: number,
    assemblyId?: number,
    boothId?: number
}) {
    const where: any = {};
    if (filters.workerId) where.workerId = filters.workerId;
    if (filters.assemblyId) where.assemblyId = filters.assemblyId;

    return await prisma.workerJanSampark.findMany({
        where,
        include: {
            worker: true
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createJansamparkRoute(data: {
    date: Date,
    assemblyId: number,
    visits: {
        village: string,
        time?: string,
        atmosphere?: string,
        notes?: string
    }[]
}) {
    await prisma.jansamparkRoute.create({
        data: {
            date: data.date,
            assemblyId: data.assemblyId,
            visits: {
                create: data.visits
            }
        }
    });
    revalidatePath('/jansampark');
    revalidatePath('/dashboard');
}

export async function deleteJansamparkRoute(id: number) {
    await prisma.jansamparkVisit.deleteMany({ where: { routeId: id } });
    await prisma.jansamparkRoute.delete({ where: { id } });
    revalidatePath('/jansampark');
}

export async function updateJansamparkRoute(id: number, data: {
    date: Date,
    visits: {
        village: string,
        time?: string,
        atmosphere?: string,
        notes?: string
    }[]
}) {
    await prisma.jansamparkVisit.deleteMany({ where: { routeId: id } });

    await prisma.jansamparkRoute.update({
        where: { id },
        data: {
            date: data.date,
            visits: {
                create: data.visits.map(v => ({
                    village: v.village,
                    time: v.time,
                    atmosphere: v.atmosphere,
                    notes: v.notes
                }))
            }
        }
    });

    revalidatePath('/jansampark');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function markPosterMade(routeId: number, userId: number) {
    await prisma.jansamparkRoute.update({
        where: { id: routeId },
        data: {
            posterMade: true,
            posterMadeAt: new Date(),
            posterMadeBy: userId,
            posterStatus: 'MADE'
        }
    });
    revalidatePath('/social/content');
    revalidatePath('/jansampark');
    return { success: true };
}

export async function markPosterNotNeeded(routeId: number, userId: number) {
    await prisma.jansamparkRoute.update({
        where: { id: routeId },
        data: {
            posterNotNeeded: true,
            posterMadeAt: new Date(), // Track when it was marked
            posterMadeBy: userId,
            posterStatus: 'NOT_NEEDED'
        }
    });
    revalidatePath('/social/content');
    revalidatePath('/jansampark');
    return { success: true };
}
