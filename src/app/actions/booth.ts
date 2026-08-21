'use server';

import { prisma as prismaClient } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

const prisma = prismaClient as any;

async function resolveAssemblyId(assemblyIdRaw?: any) {
    const session = await auth();
    const user_s = session?.user as any;
    
    let targetAssemblyId: number | null = null;

    // 1. If logged-in user has an assigned assembly (e.g. Candidate 14)
    if (user_s?.assemblyId) {
        targetAssemblyId = parseInt(user_s.assemblyId.toString(), 10);
    }

    // 2. If assemblyIdRaw was passed, verify that it actually exists in DB
    if (assemblyIdRaw !== undefined && assemblyIdRaw !== null && assemblyIdRaw !== '') {
        const parsed = parseInt(assemblyIdRaw.toString(), 10);
        if (!isNaN(parsed) && parsed > 0) {
            const exists = await prisma.assembly.findUnique({ where: { id: parsed }, select: { id: true } });
            if (exists) {
                if (!targetAssemblyId || ['ADMIN', 'SUPERADMIN'].includes(user_s?.role)) {
                    targetAssemblyId = parsed;
                }
            }
        }
    }

    // 3. Fallback: Find first existing assembly in DB
    if (!targetAssemblyId) {
        const firstAsm = await prisma.assembly.findFirst({ select: { id: true } });
        targetAssemblyId = firstAsm ? firstAsm.id : 14;
    }

    return targetAssemblyId;
}

export async function getBooths(assemblyIdRaw?: any) {
    const assemblyId = await resolveAssemblyId(assemblyIdRaw);
    const booths = await prisma.booth.findMany({
        where: { assemblyId },
        orderBy: { number: 'asc' }
    });

    const allWorkers = await prisma.worker.findMany({
        where: { assemblyId, deletedAt: null },
        select: { id: true, name: true, mobile: true, type: true, boothId: true, boothIds: true, user: { select: { mobile: true } } }
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

            // Match all workers assigned to this booth (via direct boothId or boothIds JSON array)
            const boothWorkers = allWorkers.filter((w: any) => {
                if (w.boothId === booth.id) return true;
                if (w.boothIds) {
                    try {
                        const ids = JSON.parse(w.boothIds).map(String);
                        if (ids.includes(booth.id.toString()) || ids.includes(booth.number.toString())) return true;
                    } catch { }
                }
                return false;
            });

            const bm = boothWorkers.find((w: any) => w.type === 'BOOTH_MANAGER' || w.type === 'BOOTH');
            const boothManagerName = bm?.name || booth.inchargeName || null;
            const boothManagerMobile = bm?.mobile || bm?.user?.mobile || booth.inchargeMobile || null;
            const pannaWorkers = boothWorkers.filter((w: any) => w.type === 'PANNA_PRAMUKH' || w.type === 'PANNA');
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

export async function getBoothsWithAssignment(assemblyIdRaw?: any) {
    const assemblyId = await resolveAssemblyId(assemblyIdRaw);
    const booths = await prisma.booth.findMany({
        where: { assemblyId },
        orderBy: { number: 'asc' }
    });

    const allManagers = await prisma.worker.findMany({
        where: { assemblyId, type: 'BOOTH_MANAGER', deletedAt: null },
        select: { id: true, name: true, boothId: true, boothIds: true }
    });

    return booths.map((b: any) => {
        const assignedManager = allManagers.find((m: any) => {
            if (m.boothId === b.id) return true;
            if (m.boothIds) {
                try {
                    const ids = JSON.parse(m.boothIds).map(String);
                    return ids.includes(b.id.toString()) || ids.includes(b.number.toString());
                } catch { }
            }
            return false;
        });

        return {
            ...b,
            workers: assignedManager ? [{ id: assignedManager.id, name: assignedManager.name }] : []
        };
    });
}

export async function getBoothCoverageStats(assemblyIdRaw?: any) {
    const assemblyId = await resolveAssemblyId(assemblyIdRaw);
    const totalBooths = await prisma.booth.count({ where: { assemblyId } });
    const allManagers = await prisma.worker.findMany({
        where: {
            assemblyId,
            type: 'BOOTH_MANAGER',
            deletedAt: null
        },
        select: { boothId: true, boothIds: true }
    });

    const assignedSet = new Set<string>();
    allManagers.forEach((m: any) => {
        if (m.boothId) assignedSet.add(m.boothId.toString());
        if (m.boothIds) {
            try {
                const ids = JSON.parse(m.boothIds);
                if (Array.isArray(ids)) {
                    ids.forEach((id: any) => assignedSet.add(id.toString()));
                }
            } catch { }
        }
    });

    const assignedCount = assignedSet.size;
    return {
        total: totalBooths,
        assigned: assignedCount,
        unassigned: Math.max(0, totalBooths - assignedCount),
        percent: totalBooths > 0 ? Math.round((assignedCount / totalBooths) * 100) : 0
    };
}
