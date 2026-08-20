'use server';

import { prisma as prismaClient } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const prisma = prismaClient as any;

export async function getBooths(assemblyIdRaw: any) {
    const assemblyId = parseInt((assemblyIdRaw || 1).toString(), 10);
    const booths = await prisma.booth.findMany({
        where: { assemblyId },
        include: {
            workers: {
                where: { deletedAt: null },
                select: { id: true, name: true, mobile: true, type: true, user: { select: { mobile: true } } }
            }
        },
        orderBy: { number: 'asc' }
    });

    // Calculate real stats from voters
    const boothsWithStats = await Promise.all(
        booths.map(async (booth: any) => {
            const voterCount = await prisma.voter.count({
                where: { assemblyId, boothNumber: booth.number }
            });

            const contactedCount = await prisma.voter.count({
                where: {
                    assemblyId,
                    boothNumber: booth.number,
                    OR: [
                        { supportStatus: { in: ['Support', 'Oppose'] } },
                        { updatedByName: { not: null } },
                        { notes: { not: null } },
                        { mobile: { not: null } }
                    ]
                }
            });

            const coverage = voterCount > 0 ? Math.round((contactedCount / voterCount) * 100) : 0;

            const supportCount = await prisma.voter.count({
                where: {
                    assemblyId,
                    boothNumber: booth.number,
                    supportStatus: 'Support'
                }
            });

            let status = 'Medium';
            const supportPercent = voterCount > 0 ? (supportCount / voterCount) * 100 : 0;
            if (supportPercent > 50) status = 'Strong';
            else if (supportPercent < 30) status = 'Weak';

            // Dominant Caste
            const casteStats = await prisma.voter.groupBy({
                by: ['caste'],
                where: {
                    assemblyId,
                    boothNumber: booth.number,
                    caste: { not: null }
                },
                _count: { caste: true },
                orderBy: { _count: { caste: 'desc' } },
                take: 1
            });
            const dominantCaste = casteStats.length > 0 ? (casteStats[0].caste || 'Unknown') : 'Unknown';

            const bm = booth.workers.find((w: any) => w.type === 'BOOTH_MANAGER' || w.type === 'BOOTH');
            const boothManagerName = bm?.name || booth.inchargeName || null;
            const boothManagerMobile = bm?.mobile || bm?.user?.mobile || booth.inchargeMobile || null;
            const pannaWorkers = booth.workers.filter((w: any) => w.type === 'PANNA_PRAMUKH' || w.type === 'PANNA');
            const pannaCount = pannaWorkers.length;

            const displayLocation = booth.villageNameHi || booth.localityMohallaHi || booth.area || booth.villageNameEn || booth.nameHi || booth.name || null;

            return {
                ...booth,
                boothManagerName,
                boothManagerMobile,
                pannaCount,
                pannaWorkers,
                totalVoters: voterCount,
                contactedCount,
                coveragePercent: coverage,
                janSamparkPercent: coverage,
                status, // Support Status (Strong/Medium/Weak)
                dominantCaste,
                isAssigned: Boolean(boothManagerName),
                displayLocation
            };
        })
    );

    return boothsWithStats;
}

export async function createBooth(data: {
    number: number,
    name?: string,
    area?: string,
    inchargeName?: string,
    inchargeMobile?: string,
    assemblyId: number,
    workerId?: number
}) {
    const { workerId, ...boothData } = data;
    const booth = await prisma.booth.create({ data: boothData });
    if (workerId) {
        await prisma.worker.update({
            where: { id: workerId },
            data: { boothId: booth.id, type: 'BOOTH_MANAGER' }
        });
    }
    revalidatePath('/booths');
}

export async function updateBooth(id: number, data: {
    name?: string,
    area?: string,
    inchargeName?: string,
    inchargeMobile?: string,
    workerId?: number
}) {
    const { workerId, ...boothData } = data;
    await prisma.booth.update({
        where: { id },
        data: boothData
    });

    if (workerId) {
        // First, if there was an old manager on this booth, we keep or update
        await prisma.worker.update({
            where: { id: workerId },
            data: { boothId: id, type: 'BOOTH_MANAGER' }
        });
    }

    revalidatePath('/booths');
}

export async function getBoothsWithAssignment(assemblyIdRaw: any) {
    const assemblyId = parseInt((assemblyIdRaw || 1).toString(), 10);
    const booths = await prisma.booth.findMany({
        where: { assemblyId },
        include: {
            workers: {
                where: { type: 'BOOTH_MANAGER' },
                select: { id: true, name: true }
            }
        },
        orderBy: { number: 'asc' }
    });
    return booths;
}

export async function getBoothCoverageStats(assemblyIdRaw: any) {
    const assemblyId = parseInt((assemblyIdRaw || 1).toString(), 10);
    const totalBooths = await prisma.booth.count({ where: { assemblyId } });
    const assignedBooths = await prisma.worker.groupBy({
        by: ['boothId'],
        where: {
            assemblyId,
            type: 'BOOTH_MANAGER',
            boothId: { not: null }
        }
    });

    const assignedCount = assignedBooths.length;
    return {
        total: totalBooths,
        assigned: assignedCount,
        unassigned: Math.max(0, totalBooths - assignedCount),
        percent: totalBooths > 0 ? Math.round((assignedCount / totalBooths) * 100) : 0
    };
}
