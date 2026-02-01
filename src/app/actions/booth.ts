'use server';

import { prisma as prismaClient } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const prisma = prismaClient as any;

export async function getBooths(assemblyId: number) {
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
                    mobile: { not: null }
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

            return {
                ...booth,
                totalVoters: voterCount,
                coveragePercent: coverage,
                status, // Support Status (Strong/Medium/Weak)
                dominantCaste,
                isAssigned: booth.workers.length > 0
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
    assemblyId: number
}) {
    await prisma.booth.create({ data });
    revalidatePath('/booths');
}

export async function updateBooth(id: number, data: {
    name?: string,
    area?: string,
    inchargeName?: string,
    inchargeMobile?: string
}) {
    await prisma.booth.update({
        where: { id },
        data
    });
    revalidatePath('/booths');
}

export async function getBoothsWithAssignment(assemblyId: number) {
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

export async function getBoothCoverageStats(assemblyId: number) {
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
