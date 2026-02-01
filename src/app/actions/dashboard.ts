/* 🔒 LOCKED BY USER */
'use server';

import { prisma as prismaClient } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
const prisma = prismaClient as any;

export async function getBoothSentimentAnalytics(assemblyId: number) {
    const voters = await prisma.voter.findMany({
        where: { assemblyId },
        select: { boothNumber: true, supportStatus: true }
    });

    const boothStats: Record<number, { support: number, neutral: number, oppose: number }> = {};

    voters.forEach((v: any) => {
        if (!v.boothNumber) return;
        if (!boothStats[v.boothNumber]) {
            boothStats[v.boothNumber] = { support: 0, neutral: 0, oppose: 0 };
        }
        const status = v.supportStatus || 'Neutral';
        if (status === 'Support') boothStats[v.boothNumber].support++;
        else if (status === 'Oppose') boothStats[v.boothNumber].oppose++;
        else boothStats[v.boothNumber].neutral++;
    });

    return Object.entries(boothStats).map(([booth, stats]) => {
        const total = stats.support + stats.neutral + stats.oppose;
        let dominant = 'Neutral';
        if (stats.support > stats.neutral && stats.support > stats.oppose) dominant = 'Support';
        else if (stats.oppose > stats.neutral && stats.oppose > stats.support) dominant = 'Oppose';

        return {
            boothNumber: parseInt(booth),
            support: Math.round((stats.support / total) * 100),
            neutral: Math.round((stats.neutral / total) * 100),
            oppose: Math.round((stats.oppose / total) * 100),
            dominant
        };
    }).sort((a, b) => a.boothNumber - b.boothNumber);
}

export async function getCasteAnalytics(assemblyId: number) {
    const voters = await prisma.voter.findMany({
        where: { assemblyId },
        select: { caste: true }
    });

    const counts: Record<string, number> = {};
    voters.forEach((v: any) => {
        const caste = v.caste || 'अन्य / अज्ञात';
        counts[caste] = (counts[caste] || 0) + 1;
    });

    // Convert to array and sort by count
    return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}

export async function getAgeAnalytics(assemblyId: number) {
    const voters = await prisma.voter.findMany({
        where: { assemblyId },
        select: { age: true }
    });

    const groups = {
        '18-25 (युवा)': 0,
        '26-45 (युवा/प्रौढ़)': 0,
        '46-60 (प्रौढ़)': 0,
        '60+ (वरिष्ठ)': 0,
        'अज्ञात': 0
    };

    voters.forEach((v: any) => {
        const age = v.age;
        if (!age) groups['अज्ञात']++;
        else if (age <= 25) groups['18-25 (युवा)']++;
        else if (age <= 45) groups['26-45 (युवा/प्रौढ़)']++;
        else if (age <= 60) groups['46-60 (प्रौढ़)']++;
        else groups['60+ (वरिष्ठ)']++;
    });

    return Object.entries(groups).map(([range, count]) => ({ range, count }));
}

export async function getDashboardStats(role: string, assemblyId: number, userId?: number) {
    // If we have an assemblyId, always return assembly-specific stats for the dashboard view
    if (assemblyId) {
        const assembly = await prisma.assembly.findUnique({
            where: { id: assemblyId }
        });
        const voters = await prisma.voter.count({ where: { assemblyId } });
        const booths = await prisma.booth.count({ where: { assemblyId } });
        const workers = await prisma.worker.count({ where: { assemblyId } });
        const tasks = await prisma.task.count({ where: { assemblyId, status: 'Completed' } });

        return {
            voters: voters || 0,
            booths: booths || 0,
            workers: workers || 0,
            tasks: tasks || 0,
            prevPartyVotes: assembly?.prevPartyVotes || 0,
            prevCandidateVotes: assembly?.prevCandidateVotes || 0,
            historicalResults: assembly?.historicalResults || null,
            casteEquation: assembly?.casteEquation || null,
            electionHistory: await prisma.electionHistory.findMany({
                where: { assemblyId },
                orderBy: { year: 'desc' }
            }),
            latestFeedback: await prisma.workerJanSampark.findMany({
                where: { assemblyId },
                include: { worker: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
                take: 5
            })
        };
    }

    // Fallback for global admin view without specific assembly (if needed elsewhere)
    if (role === 'ADMIN' || role === 'SUPERADMIN') {
        const assembliesCount = await prisma.assembly.count();
        const usersCount = await prisma.user.count();
        const votersCount = await prisma.voter.count();
        return {
            assemblies: assembliesCount,
            users: usersCount,
            voters: votersCount,
            booths: 0, workers: 0, tasks: 0,
            prevPartyVotes: 0, prevCandidateVotes: 0,
            historicalResults: null, casteEquation: null
        };
    }

    if (role === 'WORKER' || role === 'SOCIAL_MEDIA') {
        const worker = await prisma.worker.findUnique({
            where: { userId },
            include: { tasks: true }
        });
        return {
            pendingTasks: worker?.tasks.filter((t: any) => t.status !== 'Completed').length || 0,
            completedTasks: worker?.tasks.filter((t: any) => t.status === 'Completed').length || 0,
            performance: worker?.performanceScore || 0
        };
    }

    return {};
}

export async function getBoothDashboardStats(userId: number) {
    let worker = await prisma.worker.findUnique({
        where: { userId },
        include: {
            booth: true,
            assignedVoters: true
        }
    });

    // Support for Admin Simulation: If no worker record but user is Admin, pick first booth
    if (!worker || !worker.booth) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user && ['ADMIN', 'SUPERADMIN'].includes(user.role)) {
            const firstBooth = await prisma.booth.findFirst({
                where: { assemblyId: user.assemblyId || 1 },
                orderBy: { number: 'asc' }
            });
            if (firstBooth) {
                // Mock-up a worker structure
                return getStatsForBooth(firstBooth, user.assemblyId || 1, null);
            }
        }
        return null;
    }

    return getStatsForBooth(worker.booth, worker.assemblyId, worker.id);
}

async function getStatsForBooth(booth: any, assemblyId: number, workerId: number | null) {
    const boothId = booth.id;
    const boothNumber = booth.number;

    // 1. Calculate Real-time Sentiment for this booth
    const boothVoters = await prisma.voter.findMany({
        where: { boothNumber, assemblyId },
        select: { supportStatus: true, age: true, caste: true }
    });

    const sentiment = { support: 0, neutral: 0, oppose: 0 };
    const ageGroups: Record<string, number> = { '18-25': 0, '26-45': 0, '46-60': 0, '60+': 0, 'Unknown': 0 };
    const casteCounts: Record<string, number> = {};

    boothVoters.forEach((v: any) => {
        // Sentiment
        const st = v.supportStatus || 'Neutral';
        if (st === 'Support') sentiment.support++;
        else if (st === 'Oppose') sentiment.oppose++;
        else sentiment.neutral++;

        // Age
        if (!v.age) ageGroups['Unknown']++;
        else if (v.age <= 25) ageGroups['18-25']++;
        else if (v.age <= 45) ageGroups['26-45']++;
        else if (v.age <= 60) ageGroups['46-60']++;
        else ageGroups['60+']++;

        // Caste
        const c = v.caste || 'अन्य / अज्ञात';
        casteCounts[c] = (casteCounts[c] || 0) + 1;
    });

    // 2. Count Panna Pramukhs in this booth
    const pannaPramukhs = await prisma.worker.count({
        where: { boothId, type: 'PANNA_PRAMUKH' }
    });

    // 3. Pending Tasks for this booth manger
    const taskCount = workerId ? await prisma.task.count({
        where: { workerId: workerId, status: 'Completed' }
    }) : 0;

    return {
        booth: booth,
        stats: {
            voters: boothVoters.length,
            pannaPramukhs,
            tasks: taskCount
        },
        realTimeAnalytics: {
            sentiment,
            age: Object.entries(ageGroups).map(([range, count]) => ({ range, count })),
            caste: Object.entries(casteCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
        },
        // Admin overrides/Manual data
        historicalResults: booth.historicalResults,
        casteEquation: booth.casteEquation
    };
}

export async function getPannaDashboardStats(userId: number) {
    let worker = await prisma.worker.findUnique({
        where: { userId },
        include: {
            assignedVoters: {
                select: {
                    supportStatus: true,
                    age: true,
                    caste: true
                }
            },
            tasks: {
                where: { status: { not: 'Completed' } },
                orderBy: { createdAt: 'desc' },
                take: 5
            }
        }
    });

    // Support for Admin Simulation: If no worker record but user is Admin, pick first panna pramukh
    if (!worker) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user && ['ADMIN', 'SUPERADMIN'].includes(user.role)) {
            worker = await prisma.worker.findFirst({
                where: { assemblyId: user.assemblyId || 1, type: 'PANNA_PRAMUKH' },
                include: {
                    assignedVoters: {
                        select: {
                            supportStatus: true,
                            age: true,
                            caste: true
                        }
                    },
                    tasks: {
                        where: { status: { not: 'Completed' } },
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    }
                }
            });
        }
        if (!worker) return null;
    }

    const voters = worker.assignedVoters || [];
    const sentiment = { support: 0, neutral: 0, oppose: 0 };
    const ageGroups: Record<string, number> = { '18-25': 0, '26-45': 0, '46-60': 0, '60+': 0, 'Unknown': 0 };
    const casteCounts: Record<string, number> = {};

    voters.forEach((v: any) => {
        // Sentiment
        const st = v.supportStatus || 'Neutral';
        if (st === 'Support') sentiment.support++;
        else if (st === 'Oppose') sentiment.oppose++;
        else sentiment.neutral++;

        // Age
        if (!v.age) ageGroups['Unknown']++;
        else if (v.age <= 25) ageGroups['18-25']++;
        else if (v.age <= 45) ageGroups['26-45']++;
        else if (v.age <= 60) ageGroups['46-60']++;
        else ageGroups['60+']++;

        // Caste
        const c = v.caste || 'अन्य / अज्ञात';
        casteCounts[c] = (casteCounts[c] || 0) + 1;
    });

    // Recent Activity / Notifications
    const recentSocial = await prisma.workerSocialTask.findMany({
        where: { workerId: worker.id, status: 'PENDING' },
        include: { campaignMaterial: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 3
    });

    const recentPrReports = await prisma.workerJanSampark.findMany({
        where: { workerId: worker.id },
        orderBy: { createdAt: 'desc' },
        take: 3
    });

    return {
        stats: {
            totalVoters: voters.length,
            completedTasks: await prisma.task.count({ where: { workerId: worker.id, status: 'Completed' } }),
            pendingTasks: await prisma.task.count({ where: { workerId: worker.id, status: 'Pending' } }),
            coverage: voters.length > 0 ? Math.round((voters.filter((v: any) => v.supportStatus !== 'Neutral').length / voters.length) * 100) : 0
        },
        analytics: {
            sentiment,
            age: Object.entries(ageGroups).map(([range, count]) => ({ range, count })),
            caste: Object.entries(casteCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
        },
        notifications: [
            ...worker.tasks.map((t: any) => ({ type: 'TASK', title: t.title, date: t.createdAt })),
            ...recentSocial.map((s: any) => ({ type: 'SOCIAL', title: s.campaignMaterial?.title || 'Social Task', date: s.createdAt }))
        ].sort((a: any, b: any) => b.date.getTime() - a.date.getTime()).slice(0, 5),
        recentActivity: recentPrReports
    };
}

export async function updateBoothAnalytics(boothId: number, data: { historicalResults?: string, casteEquation?: string }) {
    return await prisma.booth.update({
        where: { id: boothId },
        data
    });
}

export async function syncElectionHistory(assemblyId: number, data: Record<string, any[]>) {
    // Delete all existing for this assembly
    await prisma.electionHistory.deleteMany({ where: { assemblyId } });

    // Insert new ones
    for (const [year, lines] of Object.entries(data)) {
        const yearInt = parseInt(year);
        if (isNaN(yearInt)) continue;

        for (const line of lines) {
            await prisma.electionHistory.create({
                data: {
                    year: yearInt,
                    partyName: line.party || 'Independent',
                    candidateName: line.candidate || 'Unknown',
                    votesReceived: line.votes || 0,
                    votePercentage: line.percent || 0,
                    assemblyId
                }
            });
        }
    }
    revalidatePath('/dashboard');
    return { success: true };
}

export async function saveAssemblyCasteEquation(assemblyId: number, casteEquation: string) {
    await prisma.assembly.update({
        where: { id: assemblyId },
        data: { casteEquation }
    });
    revalidatePath('/dashboard');
    return { success: true };
}
