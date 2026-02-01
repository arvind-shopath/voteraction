/* 🔒 LOCKED BY USER */
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';

export async function getVoters(filters: {
    search?: string;
    booth?: string;
    gender?: string;
    status?: string;
    village?: string;
    caste?: string;
    subCaste?: string;
    surname?: string;
    familySize?: string;
    ageFilter?: string;
    assemblyId?: number;
    pannaId?: number;
    pannaOnly?: boolean;
    page?: number;
    pageSize?: number;
}) {
    const { search, booth, gender, status, village, caste, subCaste, surname, familySize, ageFilter, assemblyId, pannaId, pannaOnly, page = 1, pageSize = 25 } = filters;

    const where: any = {};

    const session = await auth();
    const user = session?.user as any;

    // Support for Simulation: Check cookies for effective role
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const effectiveRole = cookieStore.get('effectiveRole')?.value || user?.role;
    const effectiveWorkerType = cookieStore.get('effectiveWorkerType')?.value;

    const userRole = effectiveRole;
    const workerBoothId = user?.boothId;
    const workerId = user?.workerId;

    if (assemblyId) {
        where.assemblyId = assemblyId;
    }

    // Role-based restrictions
    if (userRole === 'WORKER' && (effectiveWorkerType === 'BOOTH_MANAGER' || effectiveWorkerType === 'PANNA_PRAMUKH')) {
        let worker = await prisma.worker.findUnique({
            where: { userId: parseInt(user.id) },
            include: { booth: true }
        });

        // Simulation Support: If Admin simulating, pick first matching worker as reference
        if (!worker && ['ADMIN', 'SUPERADMIN'].includes(user?.role)) {
            worker = await prisma.worker.findFirst({
                where: {
                    assemblyId: assemblyId || user?.assemblyId || 1,
                    type: effectiveWorkerType as any
                },
                include: { booth: true }
            });
        }

        if (worker?.boothId) {
            where.boothNumber = worker.booth?.number;
        }

        if (pannaOnly && worker?.id) {
            where.pannaPramukhId = worker.id;
        }
    }

    if (search) {
        where.OR = [
            { name: { contains: search } },
            { epic: { contains: search } },
            { relativeName: { contains: search } },
            { mobile: { contains: search } }
        ];
    }

    if (booth && booth !== 'सभी बूथ') {
        const boothNumStr = booth.toString().replace('बूथ ', '');
        const boothNum = parseInt(boothNumStr);
        if (!isNaN(boothNum)) {
            where.boothNumber = boothNum;
        }
    }

    if (gender && gender !== 'सभी' && gender !== 'सभी लिंग') {
        where.gender = gender;
    }

    if (familySize && familySize !== 'सभी परिवार') {
        if (familySize === '7+') {
            where.familySize = { gte: 7 };
        } else if (familySize === '1-3') {
            where.familySize = { lte: 3 };
        } else if (familySize === '4-6') {
            where.familySize = { gte: 4, lte: 6 };
        }
    }

    if (ageFilter && ageFilter !== 'सभी आयु') {
        switch (ageFilter) {
            case '18-24': // पहली बार के मतदाता
                where.age = { gte: 18, lte: 24 };
                break;
            case '24-45': // युवा
                where.age = { gte: 24, lte: 45 };
                break;
            case '45-60': // 45-60
                where.age = { gte: 45, lte: 60 };
                break;
            case '60+': // वरिष्ठ नागरिक
                where.age = { gte: 60 };
                break;
        }
    }

    if (status && status !== 'समर्थन स्थिति') {
        if (['Active', 'In-active', 'Dead', 'Shifted'].includes(status)) {
            where.status = status;
        } else {
            where.supportStatus = status;
        }
    }

    if (village && village !== 'सभी गांव') {
        where.village = { contains: village };
    }

    if (caste && caste !== 'सभी जाति') {
        where.caste = caste;
    }

    if (subCaste && subCaste !== 'सभी उपजाति') {
        where.subCaste = subCaste;
    }

    if (surname && surname !== 'सभी उपनाम') {
        where.surname = surname;
    }

    const campaignId = user?.campaignId;

    const [voters, totalCount] = await Promise.all([
        (prisma.voter as any).findMany({
            where,
            include: campaignId ? {
                feedbacks: {
                    where: { campaignId }
                }
            } : undefined,
            orderBy: { id: 'asc' },
            skip: (page - 1) * pageSize,
            take: pageSize
        }),
        prisma.voter.count({ where })
    ]);

    const votersWithBoothInfo = voters.map((v: any) => {
        const feedback = (v as any).feedbacks?.[0];
        return {
            ...v,
            // Shadowing global fields with campaign-specific feedback if it exists
            supportStatus: feedback?.supportStatus ?? v.supportStatus,
            notes: feedback?.notes ?? v.notes,
            isVoted: feedback?.isVoted ?? v.isVoted,
            status: feedback?.status ?? v.status,
            mobile: feedback?.mobile ?? v.mobile,
            updatedByName: feedback?.updatedByName ?? v.updatedByName,
            boothName: v.boothNumber ? `Booth ${v.boothNumber}` : null
        };
    });

    return { voters: votersWithBoothInfo, totalCount, page, totalPages: Math.ceil(totalCount / pageSize) };
}

export async function upsertVoters(voterList: any[], assemblyId: number) {
    const results = { created: 0, updated: 0 };

    for (const v of voterList) {
        if (!v.epic) {
            await prisma.voter.create({
                data: {
                    ...v,
                    assemblyId,
                    supportStatus: 'Neutral',
                    status: 'Active'
                }
            });
            results.created++;
            continue;
        }

        const existing = await prisma.voter.findUnique({
            where: { epic: v.epic }
        });

        if (existing) {
            await prisma.voter.update({
                where: { epic: v.epic },
                data: {
                    name: v.name || existing.name,
                    age: v.age || existing.age,
                    gender: v.gender || existing.gender,
                    relativeName: v.relativeName || existing.relativeName,
                    relationType: v.relationType || existing.relationType,
                    houseNumber: v.houseNumber || existing.houseNumber,
                    boothNumber: v.boothNumber || existing.boothNumber,
                    village: v.village || existing.village,
                    area: v.area || existing.area,
                    caste: v.caste || existing.caste,
                    subCaste: v.subCaste || existing.subCaste,
                    surname: v.surname || existing.surname,
                    assemblyId
                }
            });
            results.updated++;
        } else {
            await prisma.voter.create({
                data: {
                    ...v,
                    assemblyId,
                    supportStatus: 'Neutral',
                    status: 'Active'
                }
            });
            results.created++;
        }
    }

    revalidatePath('/voters');
    return results;
}

// Worker/User Action: Update Voter details
export async function updateVoter(voterId: number, data: any) {
    const session = await auth();
    const user = session?.user;
    const campaignId = (user as any)?.campaignId;

    // 1. Separate shared data from isolated feedback
    const sharedFields = {
        name: data.name,
        age: data.age ? parseInt(data.age.toString()) : undefined,
        gender: data.gender,
        relativeName: data.relativeName,
        relationType: data.relationType,
        houseNumber: data.houseNumber,
        boothNumber: data.boothNumber ? parseInt(data.boothNumber.toString()) : undefined,
        village: data.village,
        area: data.area,
        caste: data.caste,
        subCaste: data.subCaste,
        surname: data.surname,
    };

    const feedbackFields = {
        supportStatus: data.supportStatus,
        notes: data.notes,
        isVoted: data.isVoted,
        status: data.status,
        mobile: data.mobile,
    };

    // Filter out undefined values to avoid overwriting with null
    const cleanShared = Object.fromEntries(Object.entries(sharedFields).filter(([_, v]) => v !== undefined));
    const cleanFeedback = Object.fromEntries(Object.entries(feedbackFields).filter(([_, v]) => v !== undefined));

    // Capture who changed it
    let updatedByName = null;
    if (user && user.name) {
        const userRole = (user as any).role;
        updatedByName = user.name + (userRole && userRole !== 'ADMIN' ? ` (${userRole})` : '');
    }

    // 2. Update Shared Voter Table (Universal sync)
    // Even in campaign mode, physical details change for everyone
    if (Object.keys(cleanShared).length > 0) {
        await prisma.voter.update({
            where: { id: voterId },
            data: cleanShared
        });
    }

    // 3. Update Isolated Feedback
    if (campaignId) {
        await (prisma as any).voterFeedback.upsert({
            where: {
                voterId_campaignId: { voterId, campaignId }
            },
            create: {
                voterId,
                campaignId,
                ...cleanFeedback,
                updatedByName
            },
            update: {
                ...cleanFeedback,
                updatedByName
            }
        });
    } else {
        // Admin Mode: Update global voter record for feedback too if not in campaign
        await prisma.voter.update({
            where: { id: voterId },
            data: { ...cleanFeedback, updatedByName }
        });
    }
    revalidatePath('/voters');
}

export async function createVoter(data: any) {
    const session = await auth();
    const assemblyId = (session?.user as any)?.assemblyId;

    if (!assemblyId) throw new Error("Assembly mapping required");

    const voter = await prisma.voter.create({
        data: {
            ...data,
            assemblyId,
            age: data.age ? parseInt(data.age.toString()) : null,
            boothNumber: data.boothNumber ? parseInt(data.boothNumber.toString()) : null,
        }
    });

    revalidatePath('/voters');
    return voter;
}

export async function deleteVoter(id: number) {
    await prisma.voter.delete({ where: { id } });
    revalidatePath('/voters');
}

export async function moveVoterToFamily(voterId: number, houseNumber: string, village: string, area: string) {
    await prisma.voter.update({
        where: { id: voterId },
        data: { houseNumber, village, area }
    });
    revalidatePath('/voters');
}

export async function searchVotersForFamily(query: string, assemblyId: number) {
    return await prisma.voter.findMany({
        where: {
            assemblyId,
            OR: [
                { name: { contains: query } },
                { epic: { contains: query } }
            ]
        },
        take: 5
    });
}

export async function exportVotersToCSV(filters: any) {
    // Only Admin can do this (verified via role in real app, here we just fetch)
    const result = await getVoters({ ...filters, pageSize: 50000 }); // Fetch large batch
    const voters = result.voters;

    const headers = ["ID", "Name", "Age", "Gender", "Epic", "Mobile", "HouseNumber", "Booth", "Village", "Caste", "SupportStatus", "Status", "Notes"];
    const rows = voters.map((v: any) => [
        v.id,
        v.name,
        v.age,
        v.gender,
        v.epic,
        v.mobile,
        v.houseNumber,
        v.boothNumber,
        v.village,
        v.caste,
        v.supportStatus,
        v.status,
        v.notes?.replace(/\n/g, ' ')
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    return csvContent;
}

// Legacy wrapper/alias for compatibility
export async function updateVoterFeedback(voterId: number, data: any) {
    return updateVoter(voterId, data);
}

export async function getVoterWithFamily(voterId: number) {
    const session = await auth();
    const campaignId = (session?.user as any)?.campaignId;

    const voter = await (prisma.voter as any).findUnique({
        where: { id: voterId },
        include: campaignId ? {
            feedbacks: { where: { campaignId } }
        } : undefined
    });

    if (!voter) return null;

    // Merge feedback
    const feedback_v = (voter as any).feedbacks?.[0];
    const mergedVoter = {
        ...voter,
        supportStatus: (feedback_v as any)?.supportStatus ?? (voter as any).supportStatus,
        notes: (feedback_v as any)?.notes ?? (voter as any).notes,
        isVoted: (feedback_v as any)?.isVoted ?? (voter as any).isVoted,
        status: (feedback_v as any)?.status ?? (voter as any).status,
        mobile: (feedback_v as any)?.mobile ?? (voter as any).mobile,
        updatedByName: (feedback_v as any)?.updatedByName ?? (voter as any).updatedByName,
    };

    // Find family members (shared houseNumber and village/area)
    const family = await (prisma.voter as any).findMany({
        where: {
            houseNumber: voter.houseNumber,
            village: voter.village,
            area: voter.area,
            assemblyId: voter.assemblyId
        },
        include: campaignId ? {
            feedbacks: { where: { campaignId } }
        } : undefined,
        orderBy: { age: 'desc' }
    });

    const mergedFamily = family.map((f: any) => {
        const feedback = (f as any).feedbacks?.[0];
        return {
            ...f,
            supportStatus: feedback?.supportStatus ?? f.supportStatus,
            notes: feedback?.notes ?? f.notes,
            isVoted: feedback?.isVoted ?? f.isVoted,
            status: feedback?.status ?? f.status,
            mobile: feedback?.mobile ?? f.mobile,
            updatedByName: feedback?.updatedByName ?? f.updatedByName,
        };
    });

    // Map booth names
    const boothNumbers = [...new Set(family.map((f: any) => f.boothNumber).filter((n: any) => n !== null))] as number[];
    const booths = await prisma.booth.findMany({
        where: { number: { in: boothNumbers }, assemblyId: (voter as any).assemblyId }
    });
    const boothMap: Record<number, string> = {};
    booths.forEach((b: any) => boothMap[b.number] = b.name || '');

    const familyWithBooth = mergedFamily.map((f: any) => ({
        ...f,
        boothName: f.boothNumber ? boothMap[f.boothNumber] : null
    }));

    return {
        ...mergedVoter,
        boothName: voter.boothNumber ? boothMap[voter.boothNumber] : null,
        family: familyWithBooth
    };
}

export async function getFilterOptions(assemblyId?: number) {
    const where = assemblyId ? { assemblyId } : {};

    const [castes, subCastes, surnames, villages, registeredBooths, voterBooths] = await Promise.all([
        prisma.voter.findMany({
            select: { caste: true },
            distinct: ['caste'],
            where: { ...where, caste: { not: null } }
        }),
        prisma.voter.findMany({
            select: { subCaste: true, caste: true },
            distinct: ['subCaste'],
            where: { ...where, subCaste: { not: null } }
        }),
        prisma.voter.findMany({
            select: { surname: true, subCaste: true },
            distinct: ['surname'],
            where: { ...where, surname: { not: null } }
        }),
        prisma.voter.findMany({
            select: { village: true },
            distinct: ['village'],
            where: { ...where, village: { not: null } },
            orderBy: { village: 'asc' }
        }),
        prisma.booth.findMany({
            where,
            orderBy: { number: 'asc' }
        }),
        prisma.voter.findMany({
            select: { boothNumber: true },
            distinct: ['boothNumber'],
            where: { ...where, boothNumber: { not: null } }
        })
    ]);

    // Create a map of registered booths for quick lookup
    const boothNameMap = new Map(registeredBooths.map(b => [b.number, b.name]));

    // Combine both sources to ensure all booths with voters or registrations are shown
    const allBoothNumbers = Array.from(new Set([
        ...registeredBooths.map(b => b.number),
        ...voterBooths.map(v => v.boothNumber as number)
    ])).sort((a, b) => a - b);

    const booths = allBoothNumbers.map(num => ({
        number: num,
        name: boothNameMap.get(num) || null
    }));

    return {
        castes: castes.map(c => c.caste as string),
        subCastes: subCastes.map(s => ({ value: s.subCaste as string, parent: s.caste as string })),
        surnames: surnames.map(s => ({ value: s.surname as string, parent: s.subCaste as string })),
        villages: villages.map(v => v.village as string),
        booths
    };
}

export async function getUnassignedVoters(assemblyId: number, boothNumber: number) {
    const where: any = {
        assemblyId,
        boothNumber,
        pannaPramukhId: null
    };
    return await (prisma as any).voter.findMany({
        where,
        take: 100, // Show a batch
        orderBy: { id: 'asc' }
    });
}

export async function updateFamilySupport(data: {
    houseNumber: string,
    village: string,
    assemblyId: number,
    supportStatus: string
}) {
    const session = await auth();
    const user = session?.user;
    const campaignId = (user as any)?.campaignId;

    // Capture who changed it
    let updatedByName = null;
    if (user && user.name) {
        updatedByName = user.name + ((user as any).role && (user as any).role !== 'ADMIN' ? ` (${(user as any).role})` : '');
    }

    // Find all family members
    const familyMembers = await prisma.voter.findMany({
        where: {
            houseNumber: data.houseNumber,
            village: data.village,
            assemblyId: data.assemblyId
        },
        select: { id: true } // Only need IDs
    });

    const results = [];
    for (const member of familyMembers) {
        // Update each member using the existing updateVoter logic (which handles campaign vs global)
        await updateVoter(member.id, { supportStatus: data.supportStatus, updatedByName });
        results.push(member.id);
    }

    revalidatePath('/voters');
    return { success: true, count: results.length };
}
