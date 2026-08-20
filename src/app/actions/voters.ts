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
    casteCategory?: string;
    caste?: string;
    subCaste?: string;
    surname?: string;
    familySize?: string;
    ageFilter?: string;
    assemblyId?: number;
    pannaId?: number | string;
    pannaOnly?: boolean;
    verificationStatus?: string;
    eciStatus?: string;
    isHead?: string;
    isPwD?: string;
    isImportant?: string;
    isVoted?: string;
    votedPartyId?: string;
    page?: number;
    pageSize?: number;
}) {
    const { search, booth, gender, status, village, casteCategory, caste, subCaste, surname, familySize, ageFilter, assemblyId, pannaId, pannaOnly, verificationStatus, eciStatus, page = 1, pageSize = 25 } = filters;


    const where: any = {};

    const session = await auth();
    const user = session?.user as any;

    if (!user) {
        return { voters: [], totalCount: 0, page: 1, totalPages: 0 };
    }

    // Support for Simulation: ONLY for SUPERADMIN
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const effectiveRole = (isSuperAdmin ? cookieStore.get('effectiveRole')?.value : null) || user?.role;
    const effectiveWorkerType = isSuperAdmin ? cookieStore.get('effectiveWorkerType')?.value : (user?.workerType || null);

    const userRole = effectiveRole || user?.role;
    const workerType = effectiveWorkerType || user?.workerType;
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'CANDIDATE'].includes(userRole);
    const workerBoothId = user?.boothId;
    const workerId = user?.workerId;
    const workerBoothNumber = user?.boothNumber;

    if (assemblyId) {
        const parsedAssemId = parseInt(String(assemblyId));
        if (!isNaN(parsedAssemId)) {
            const targetAssem = await prisma.assembly.findFirst({
                where: { OR: [{ id: parsedAssemId }, { number: parsedAssemId }] },
                select: { id: true }
            });
            if (targetAssem) {
                where.assemblyId = targetAssem.id;
            } else {
                where.assemblyId = parsedAssemId;
            }
        }
    }

    // Role-based restrictions
    if (userRole === 'WORKER') {
        let worker: any = null;

        // If we don't have booth in session, we MUST fetch from DB
        const isActuallyAdmin = ['ADMIN', 'SUPERADMIN', 'CANDIDATE'].includes(user?.role);
        if (!workerBoothNumber || (isActuallyAdmin && effectiveWorkerType)) {
            worker = await prisma.worker.findUnique({
                where: { userId: parseInt(user.id) },
                include: { booth: true }
            });

            // Simulation Support
            if (!worker && isActuallyAdmin) {
                worker = await prisma.worker.findFirst({
                    where: {
                        assemblyId: assemblyId || user?.assemblyId || 1,
                        type: workerType as any
                    },
                    include: { booth: true }
                });
            }
        }

        // Enforce booth restriction
        const boothToUse = workerBoothNumber || worker?.booth?.number;
        if (boothToUse) {
            where.boothNumber = boothToUse;
        }

        if (workerType === 'PANNA_PRAMUKH') {
            // ONLY restrict to assigned voters if explicitly requested (Your Panna view)
            if (pannaOnly || booth === 'my-panna') {
                where.pannaPramukhId = workerId || worker?.id;
            }
        }
    }

    if (search) {
        where.OR = [
            { name: { contains: search } },
            { nameEn: { contains: search } },
            { nameHi: { contains: search } },
            { epic: { contains: search } },
            { relativeName: { contains: search } },
            { relativeNameEn: { contains: search } },
            { relativeNameHi: { contains: search } },
            { houseNumber: { contains: search } },
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
            case '25-35': // युवा
                where.age = { gte: 25, lte: 35 };
                break;
            case '36-60': // मध्यम
                where.age = { gte: 36, lte: 60 };
                break;
            case '60+': // वरिष्ठ नागरिक
                where.age = { gte: 60 };
                break;
        }
    }

    if (filters.isHead === 'true') where.isHead = true;
    if (filters.isPwD === 'true') where.isPwD = true;
    if (filters.isImportant === 'true') where.isImportant = true;

    if (filters.pannaId && filters.pannaId !== 'सभी पन्ना प्रमुख') {
        const pId = parseInt(filters.pannaId.toString());
        if (!isNaN(pId)) {
            where.pannaPramukhId = pId;
        }
    }

    if (filters.isVoted) {
        if (filters.isVoted === 'true' || filters.isVoted === 'Yes') where.isVoted = true;
        else if (filters.isVoted === 'false' || filters.isVoted === 'No') where.isVoted = false;
    }

    if (filters.votedPartyId) {
        where.votedPartyId = parseInt(filters.votedPartyId);
    }

    if (status && status !== 'समर्थन स्थिति' && status !== 'सभी स्थिति') {
        if (['Active', 'In-active', 'Dead', 'Shifted'].includes(status)) {
            where.status = status;
        } else {
            where.supportStatus = status;
        }
    }

    if (filters.verificationStatus && filters.verificationStatus !== 'सभी') {
        where.verificationStatus = filters.verificationStatus;
    }

    if (filters.eciStatus && filters.eciStatus !== 'सभी') {
        if (filters.eciStatus === 'NEW_REQUEST' || filters.eciStatus === 'NOT_IN_LIST') {
            where.eciStatus = { in: ['NEW_REQUEST', 'NOT_IN_LIST'] };
        } else if (filters.eciStatus === 'DELETE_REQUESTED' || filters.eciStatus === 'CORRECTION_REQUIRED') {
            where.eciStatus = { in: ['DELETE_REQUESTED', 'CORRECTION_REQUIRED'] };
        } else if (filters.eciStatus === 'RESOLVED') {
            where.eciStatus = { in: ['RESOLVED_ADDED', 'RESOLVED_DELETED'] };
        } else {
            where.eciStatus = filters.eciStatus;
        }
    } else {
        // By default, exclude unapproved new card requests and deleted voters from regular list
        where.eciStatus = { notIn: ['NEW_REQUEST', 'NOT_IN_LIST', 'RESOLVED_DELETED'] };
    }

    if (village && village !== 'सभी गांव') {
        where.village = village;
    }

    if (casteCategory && casteCategory !== 'सभी वर्ग') {
        // Map Hindi UI values to English DB values (DB stores: OBC, SC, ST, General, Muslim)
        const casteCategoryMap: Record<string, string[]> = {
            'ओबीसी': ['OBC', 'ओबीसी'],
            'एससी': ['SC', 'एससी'],
            'एसटी': ['ST', 'एसटी'],
            'सामान्य': ['General', 'सामान्य', 'GENERAL', 'GEN'],
            'मुस्लिम': ['Muslim', 'मुस्लिम', 'MUSLIM'],
            'अज्ञात': ['Unknown', 'अज्ञात', 'UNKNOWN'],
        };
        const mappedValues = casteCategoryMap[casteCategory];
        if (mappedValues) {
            where.casteCategory = { in: mappedValues };
        } else {
            // Value might already be English (OBC, SC, etc.) — use as-is
            where.casteCategory = casteCategory;
        }
    }

    if (caste && caste !== 'सभी जाति') {
        where.caste = caste;
    }


    if (subCaste && subCaste !== 'सभी उपजाति') {
        where.subCaste = subCaste;
    }

    if (filters.contactStatus && filters.contactStatus !== 'सभी' && filters.contactStatus !== 'सभी संपर्क स्थिति') {
        if (filters.contactStatus === 'Contacted' || filters.contactStatus === 'संपर्कित') {
            where.OR = [
                ...(where.OR || []),
                { supportStatus: { in: ['Support', 'Oppose'] } },
                { updatedByName: { not: null } },
                { notes: { not: null } }
            ];
        } else if (filters.contactStatus === 'Pending' || filters.contactStatus === 'संपर्क बाकी') {
            where.supportStatus = 'Neutral';
            where.updatedByName = null;
            where.notes = null;
        }
    }

    if (surname && surname !== 'सभी उपनाम') {
        where.surname = surname;
    }

    const campaignId = user?.campaignId;

    let canAccessMasterMobile = true;
    if (campaignId) {
        const campaign = await (prisma as any).campaign.findUnique({
            where: { id: campaignId },
            select: { allowMasterMobileAccess: true }
        });
        if (campaign && campaign.allowMasterMobileAccess === false) {
            canAccessMasterMobile = false;
        }
    }

    const [voters, totalCount] = await Promise.all([
        (prisma.voter as any).findMany({
            where,
            include: {
                votedParty: true,
                ...(campaignId ? {
                    feedbacks: {
                        where: { campaignId },
                        include: { votedParty: true }
                    }
                } : {})
            },
            orderBy: { id: 'asc' },
            skip: (page - 1) * pageSize,
            take: pageSize
        }),
        prisma.voter.count({ where })
    ]);

    const votersWithBoothInfo = voters.map((v: any) => {
        const feedback = (v as any).feedbacks?.[0];
        const effectiveMobile = feedback?.mobile ?? (canAccessMasterMobile ? v.mobile : null);
        return {
            ...v,
            // Shadowing global fields with campaign-specific feedback if it exists
            supportStatus: feedback?.supportStatus ?? v.supportStatus,
            notes: feedback?.notes ?? v.notes,
            isVoted: feedback?.isVoted ?? v.isVoted,
            votedPartyId: feedback?.votedPartyId ?? v.votedPartyId,
            votedParty: feedback?.votedParty ?? v.votedParty,
            status: feedback?.status ?? v.status,
            mobile: effectiveMobile,
            updatedByName: feedback?.updatedByName ?? v.updatedByName,
            verificationStatus: feedback?.verificationStatus ?? v.verificationStatus,
            eciStatus: feedback?.eciStatus ?? v.eciStatus,
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
        epic: data.epic,
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
        casteCategory: data.casteCategory,
        surname: data.surname,
        mobile: data.mobile, // ALSO SAVED TO MASTER VOTER RECORD
        isHead: data.isHead,
        isPwD: data.isPwD,
        isImportant: data.isImportant,
        // SYNC POLL DAY DATA TO GLOBAL TABLE
        isVoted: data.isVoted,
        votedPartyId: data.votedPartyId ? parseInt(data.votedPartyId.toString()) : undefined,
        votedSentiment: data.votedSentiment
    };

    const feedbackFields = {
        supportStatus: data.supportStatus,
        notes: data.notes,
        isVoted: data.isVoted,
        status: data.status,
        mobile: data.mobile,
        votedSentiment: data.votedSentiment,
        votedPartyId: data.votedPartyId ? parseInt(data.votedPartyId.toString()) : undefined,
        verificationStatus: data.verificationStatus,
        eciStatus: data.eciStatus
    };

    // CRITICAL: Poll Day Check for isVoted
    if (data.isVoted !== undefined) {
        const assembly = await prisma.assembly.findUnique({
            where: { id: (user as any).assemblyId || 1 },
            select: { electionDate: true }
        });

        const userRole = (user as any).role;
        const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(userRole);

        if (!assembly?.electionDate) {
            if (!isAdmin) {
                throw new Error("मतदान की तारीख (Election Date) अभी तय नहीं की गई है। कृपया एडमिन से संपर्क करें।");
            }
        } else {
            const today = new Date();
            const election = new Date(assembly.electionDate);
            const isSameDay = today.getFullYear() === election.getFullYear() &&
                today.getMonth() === election.getMonth() &&
                today.getDate() === election.getDate();

            if (!isSameDay && !isAdmin) {
                throw new Error("मतदान की स्थिति (Voted Status) केवल मतदान के दिन ही बदली जा सकती है।");
            }
        }
    }

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
    // CRITICAL: ECI Confirmation Flow
    if (Object.keys(cleanShared).length > 0) {
        const userRole = (user as any).role;

        // If Admin/Candidate, update directly
        if (['ADMIN', 'SUPERADMIN', 'CANDIDATE'].includes(userRole)) {
            await prisma.voter.update({
                where: { id: voterId },
                data: cleanShared
            });
        } else {
            // Worker: Create Request instead of direct update
            let realWorkerId = (user as any).workerId;
            if (!realWorkerId) {
                const w = await prisma.worker.findUnique({ where: { userId: parseInt((user as any).id) } });
                realWorkerId = w?.id;
            }

            if (realWorkerId) {
                const assemblyId = (user as any).assemblyId;
                if (assemblyId) {
                    await (prisma as any).voterEditRequest.create({
                        data: {
                            voterId,
                            workerId: realWorkerId,
                            assemblyId,
                            changes: JSON.stringify(cleanShared),
                            status: 'PENDING'
                        }
                    });
                }
            }
            // We do NOT update the Voter table here.
        }
    }

    // 3. Update Isolated Feedback
    if (campaignId) {
        // If in a campaign, we update the feedback table.
        // The user mentioned "isolation" - so we should avoid syncing supportStatus back to the global Voter record
        // if they want separate data. However, physical details (sharedFields) should still sync.
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
        await (prisma.voter as any).update({
            where: { id: voterId },
            data: { ...cleanFeedback, updatedByName }
        });
    }
    revalidatePath('/voters');

    // 4. Sync Family Size for manual updates
    if (cleanShared.village !== undefined || cleanShared.houseNumber !== undefined) {
        const voter = await prisma.voter.findUnique({ where: { id: voterId } });
        if (voter && voter.houseNumber) {
            const count = await prisma.voter.count({
                where: {
                    village: voter.village || '',
                    houseNumber: voter.houseNumber,
                    assemblyId: voter.assemblyId
                }
            });
            await prisma.voter.updateMany({
                where: {
                    village: voter.village || '',
                    houseNumber: voter.houseNumber,
                    assemblyId: voter.assemblyId
                },
                data: { familySize: count }
            });
        }
    }

    // 5. Add Points
    if (user && (user as any).id) {
        const { addWorkerPoints } = await import('./worker');
        await addWorkerPoints(parseInt((user as any).id), 'VOTER_UPDATE', 20, `Updated Voter: ${voterId}`);
    }
}

export async function createVoter(data: any) {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    // Prioritize assemblyId from data (for simulation) then terminal session
    const assemblyId = data.assemblyId || (session?.user as any)?.assemblyId;

    if (!assemblyId) throw new Error("Assembly mapping required");

    // Check for existing EPIC
    if (data.epic) {
        const existing = await prisma.voter.findUnique({
            where: { epic: data.epic }
        });
        if (existing) {
            throw new Error(`EPIC ${data.epic} already exists for voter: ${existing.name}`);
        }
    }

    // Capture who created it
    const userName = session?.user?.name || 'Unknown';
    const effectiveWorkerType = (session?.user as any)?.workerType;
    const isBoothManager = effectiveWorkerType === 'BOOTH_MANAGER';

    // Validation: Name is required
    if (!data.name) {
        throw new Error("Voter name is required.");
    }

    // Process Booth Number
    let processedBoothNumber: number | null = null;
    if (data.boothNumber) {
        processedBoothNumber = parseInt(data.boothNumber.toString());
        if (isNaN(processedBoothNumber)) processedBoothNumber = null;
    }

    // Process Age
    let processedAge: number | null = null;
    if (data.age) {
        processedAge = parseInt(data.age.toString());
        if (isNaN(processedAge)) processedAge = null;
    }

    const voter = await prisma.voter.create({
        data: {
            name: data.name,
            age: processedAge,
            gender: data.gender || 'M',
            relativeName: data.relativeName,
            relationType: data.relationType, // Corrected from relationshipType
            houseNumber: data.houseNumber,
            mobile: data.mobile,
            epic: data.epic || null,
            village: data.village,
            area: data.area, // Corrected from address
            supportStatus: data.supportStatus || 'Neutral',
            boothNumber: processedBoothNumber,
            assemblyId: parseInt(assemblyId.toString()),
            verificationStatus: userRole === 'ADMIN' || userRole === 'CANDIDATE' ? 'VERIFIED' : 'PENDING', // Changed MANAGER to CANDIDATE based on original
            eciStatus: data.eciStatus || 'IN_LIST',
            caste: data.caste,
            subCaste: data.subCaste,
            casteCategory: data.casteCategory,
            updatedByName: userName,
        }
    });

    revalidatePath('/voters');
    return { success: true, voter };
}

export async function verifyVoter(voterId: number) {
    const session = await auth();
    const user = session?.user;
    if (!user) throw new Error("Unauthorized");

    await (prisma.voter as any).update({
        where: { id: voterId },
        data: { verificationStatus: 'VERIFIED' }
    });

    // Also update in feedback if exists
    const campaignId = (user as any)?.campaignId;
    if (campaignId) {
        await (prisma as any).voterFeedback.updateMany({
            where: { voterId, campaignId },
            data: { verificationStatus: 'VERIFIED' }
        });
    }

    revalidatePath('/voters');
    return { success: true };
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

export async function addToFamily(voterId: number, houseNumber: string, village: string, area: string) {
    return moveVoterToFamily(voterId, houseNumber, village, area);
}

export async function separateFromFamily(voterId: number, reason: string, newHouseNumber?: string, notes?: string) {
    const voter = await prisma.voter.findUnique({
        where: { id: voterId },
        select: {
            id: true,
            name: true,
            familyId: true,
            assemblyId: true,
            boothNumber: true,
            houseNumber: true,
            village: true,
            isHead: true,
            notes: true
        }
    });

    if (!voter) throw new Error('Voter not found');

    const oldFamilyId = voter.familyId;
    const cleanHouse = newHouseNumber?.trim() || `${voter.houseNumber || '1'}/A`;
    const newFamilyId = `FAM_${voter.assemblyId}_B${voter.boothNumber || 0}_SEP_${Date.now()}`;

    const separationNote = `[पारिवारिक पृथक्करण / अलग परिवार] कारण: ${reason || 'पारिवारिक बंटवारा'}${notes ? ` | टिप्पणी: ${notes}` : ''}`;
    const combinedNotes = voter.notes ? `${voter.notes}\n${separationNote}` : separationNote;

    // 1. Update the separated voter: new familyId, new houseNumber, isHead = true (new independent family)
    await prisma.voter.update({
        where: { id: voterId },
        data: {
            familyId: newFamilyId,
            houseNumber: cleanHouse,
            familySize: 1,
            isHead: true,
            notes: combinedNotes
        }
    });

    // 2. If the separated voter was the head of the old family, promote the oldest male in the old family to be the new head
    if (oldFamilyId) {
        const remainingMembers = await prisma.voter.findMany({
            where: { familyId: oldFamilyId, id: { not: voterId } },
            select: { id: true, age: true, gender: true, isHead: true }
        });

        // Update family size for old family
        await prisma.voter.updateMany({
            where: { familyId: oldFamilyId },
            data: { familySize: remainingMembers.length }
        });

        // If the old family lost its head or has no head now, pick the oldest male (or oldest female)
        const hasActiveHead = remainingMembers.some(m => m.isHead);
        if (!hasActiveHead && remainingMembers.length > 0) {
            remainingMembers.sort((a, b) => {
                const isAMale = (a.gender === 'M' || a.gender === 'Male' || a.gender === 'पुरुष') ? 1 : 0;
                const isBMale = (b.gender === 'M' || b.gender === 'Male' || b.gender === 'पुरुष') ? 1 : 0;
                if (isAMale !== isBMale) return isBMale - isAMale;
                return (b.age || 0) - (a.age || 0);
            });
            await prisma.voter.update({
                where: { id: remainingMembers[0].id },
                data: { isHead: true }
            });
        }
    }

    revalidatePath('/voters');
    return { success: true, message: 'सदस्य को नए परिवार में सफलतापूर्वक अलग कर दिया गया।' };
}

export async function removeFromFamily(voterId: number) {
    return separateFromFamily(voterId, 'पारिवारिक बंटवारा');
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

    // Find family members using familyId or tight booth+house+relative match
    const familyWhere: any = { assemblyId: voter.assemblyId };
    if (voter.familyId) {
        familyWhere.familyId = voter.familyId;
    } else if (voter.houseNumber && voter.village) {
        familyWhere.houseNumber = voter.houseNumber;
        familyWhere.village = voter.village;
        familyWhere.boothNumber = voter.boothNumber;
        if (voter.relativeName) {
            familyWhere.relativeName = voter.relativeName;
        }
    } else {
        familyWhere.id = voter.id;
    }

    const family = await (prisma.voter as any).findMany({
        where: familyWhere,
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

export async function setHeadOfFamily(voterId: number) {
    const voter = await prisma.voter.findUnique({
        where: { id: voterId },
        select: { id: true, familyId: true, boothNumber: true, houseNumber: true, assemblyId: true, village: true }
    });
    if (!voter) throw new Error('Voter not found');

    // 1. Reset isHead for all other members in this family / household
    if (voter.familyId) {
        await prisma.voter.updateMany({
            where: { familyId: voter.familyId, assemblyId: voter.assemblyId },
            data: { isHead: false }
        });
    } else if (voter.boothNumber && voter.houseNumber) {
        await prisma.voter.updateMany({
            where: {
                assemblyId: voter.assemblyId,
                boothNumber: voter.boothNumber,
                houseNumber: voter.houseNumber
            },
            data: { isHead: false }
        });
    }

    // 2. Set this voter as head
    const updated = await prisma.voter.update({
        where: { id: voterId },
        data: { isHead: true }
    });

    revalidatePath('/voters');
    return { success: true, voter: updated };
}

export async function getFilterOptions(assemblyId?: number) {
    const where = assemblyId ? { assemblyId } : {};

    let assemblyState = 'National';
    let assemblyName = '';
    let assemblyNumber: number | null = null;
    if (assemblyId) {
        const assembly = await prisma.assembly.findUnique({ where: { id: assemblyId }, select: { name: true, nameHindi: true, number: true, state: true } });
        if (assembly) {
            assemblyState = assembly.state;
            assemblyName = assembly.nameHindi || assembly.name;
            assemblyNumber = assembly.number;
        }
    }

    const [casteCategories, castes, subCastes, surnames, villages, registeredBooths, voterBooths, parties, pannaPramukhs, boothManagers, villageBoothPairs] = await Promise.all([
        prisma.voter.findMany({
            select: { casteCategory: true },
            distinct: ['casteCategory'],
            where: { ...where, casteCategory: { not: null } }
        }),
        prisma.voter.findMany({
            select: { caste: true, casteCategory: true },
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
        }),
        prisma.party.findMany({
            where: {
                OR: [
                    { state: assemblyState },
                    { state: 'National' },
                    { state: null }
                ]
            },
            orderBy: { name: 'asc' }
        }),
        prisma.worker.findMany({
            where: {
                ...where,
                type: 'PANNA_PRAMUKH',
                status: 'Active'
            },
            include: {
                booth: true
            },
            orderBy: { name: 'asc' }
        }),
        prisma.worker.findMany({
            where: {
                ...where,
                type: 'BOOTH_MANAGER',
                status: 'Active'
            },
            include: {
                booth: true,
                user: true
            },
            orderBy: { name: 'asc' }
        }),
        prisma.voter.findMany({
            select: { village: true, boothNumber: true },
            distinct: ['village', 'boothNumber'],
            where: { ...where, village: { not: null }, boothNumber: { not: null } }
        })
    ]);

    // Build complete booth list mapping numbers to names
    const boothNameMap = new Map<number, string>();
    registeredBooths.forEach(b => {
        const bName = b.nameHi || b.name || b.nameEn;
        if (bName && !bName.startsWith('Booth No.')) {
            boothNameMap.set(b.number, bName);
        }
    });

    if (assemblyId) {
        const importJobs = await (prisma as any).importJob.findMany({
            where: { assemblyId, boothName: { not: null } },
            select: { boothNumber: true, boothName: true }
        });
        importJobs.forEach((ij: any) => {
            if (ij.boothNumber && ij.boothName && !boothNameMap.has(ij.boothNumber)) {
                boothNameMap.set(ij.boothNumber, ij.boothName);
            }
        });
    }

    // Combine both sources to ensure all booths with voters or registrations are shown
    const allBoothNumbers = Array.from(new Set([
        ...registeredBooths.map(b => b.number),
        ...voterBooths.map(v => v.boothNumber as number)
    ])).sort((a, b) => a - b);

    const booths = allBoothNumbers.map(num => ({
        number: num,
        name: boothNameMap.get(num) || (registeredBooths.find(b => b.number === num)?.villageNameHi || null)
    }));

    const englishToHindi: Record<string, string> = {
        'OBC': 'ओबीसी', 'SC': 'एससी', 'ST': 'एसटी',
        'General': 'सामान्य', 'GENERAL': 'सामान्य', 'GEN': 'सामान्य',
        'Muslim': 'मुस्लिम', 'MUSLIM': 'मुस्लिम',
        'Other': 'अन्य', 'OTHER': 'अन्य',
        'Unknown': 'अज्ञात', 'UNKNOWN': 'अज्ञात',
    };

    return {
        casteCategories: Array.from(new Set(
            casteCategories
                .map(c => c.casteCategory as string)
                .filter(Boolean)
                .map(cat => englishToHindi[cat] || cat)
        )),
        castes: castes.map(c => {
            const rawCat = (c.casteCategory as string) || '';
            return {
                caste: c.caste as string,
                category: englishToHindi[rawCat] || rawCat,
                rawCategory: rawCat
            };
        }).filter(c => Boolean(c.caste)),
        subCastes: subCastes.map(s => ({ value: s.subCaste as string, parent: s.caste as string })),
        surnames: surnames.map(s => ({ value: s.surname as string, parent: s.subCaste as string })),
        villages: villages.map(v => v.village as string).filter(Boolean),
        booths: booths || [],
        villageBooths: villageBoothPairs.map(vb => ({ village: vb.village as string, boothNumber: vb.boothNumber as number })),
        parties: parties || [],
        pannaPramukhs: pannaPramukhs.map(p => ({ id: p.id, name: p.name, boothNumber: p.booth?.number })),
        boothManagers: boothManagers.map(bm => ({
            id: bm.id,
            name: bm.name,
            mobile: bm.mobile || bm.user?.mobile || '',
            boothNumber: bm.booth?.number,
            boothName: bm.booth?.name
        })),
        assemblyName,
        assemblyNumber
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

export async function updateVoterVotedStatus(voterId: number, isVoted: boolean, votedPartyId?: number, votedSentiment?: string) {
    const session = await auth();
    const user = session?.user;
    if (!user) return { success: false };

    const userRole = (user as any).role;
    const userName = user.name;
    const updatedBy = `${userName} (${userRole})`;

    await updateVoter(voterId, {
        isVoted,
        votedPartyId,
        votedSentiment,
        updatedByName: updatedBy
    });

    if (isVoted) {
        const { addWorkerPoints } = await import('./worker');
        await addWorkerPoints(parseInt((user as any).id), 'POLL_DAY_VOTE', 20, `Voter Marked Voted: ${voterId}`);
    }

    return { success: true };
}

export async function getVoterEditRequests(assemblyId: number) {
    const requests = await (prisma as any).voterEditRequest.findMany({
        where: { assemblyId, status: 'PENDING' },
        include: {
            voter: true,
            worker: true
        },
        orderBy: { createdAt: 'desc' }
    });
    return requests;
}

export async function approveVoterEditRequest(requestId: number) {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (!['ADMIN', 'SUPERADMIN', 'CANDIDATE'].includes(userRole)) throw new Error("Unauthorized");

    const req = await (prisma as any).voterEditRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new Error("Request not found");

    const changes = JSON.parse(req.changes);

    // Apply changes
    await prisma.voter.update({
        where: { id: req.voterId },
        data: changes
    });

    // Mark Approved
    await (prisma as any).voterEditRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' }
    });

    revalidatePath('/voters');
    return { success: true };
}

export async function rejectVoterEditRequest(requestId: number) {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (!['ADMIN', 'SUPERADMIN', 'CANDIDATE'].includes(userRole)) throw new Error("Unauthorized");

    await (prisma as any).voterEditRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
    });

    revalidatePath('/voters');
    return { success: true };
}

export async function updateEciStatus(voterId: number, status: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    await prisma.voter.update({
        where: { id: voterId },
        data: {
            eciStatus: status,
            updatedByName: session.user.name + ` (ECI Update)`
        }
    });

    revalidatePath('/voters');
    revalidatePath('/eci-updates');
    return { success: true };
}

export async function requestEciDeletion(voterId: number, reason: string, notes?: string) {
    const session = await auth();
    const userName = session?.user?.name || 'कार्यकर्ता';

    const noteText = notes ? `[विलोपन कारण: ${reason}] ${notes}` : `[विलोपन कारण: ${reason}]`;

    await prisma.voter.update({
        where: { id: voterId },
        data: {
            eciStatus: 'DELETE_REQUESTED',
            notes: noteText,
            status: 'In-active',
            updatedByName: userName
        }
    });

    revalidatePath('/voters');
    revalidatePath('/eci-updates');
    return { success: true, message: 'मतदाता को ECI से हटवाने हेतु सफलतापूर्वक दर्ज किया गया।' };
}

export async function resolveEciAddition(voterId: number, epic: string, boothNumber?: number) {
    const session = await auth();
    const userName = session?.user?.name || 'ECI Team';

    if (!epic || !epic.trim()) {
        throw new Error("EPIC नंबर अनिवार्य है।");
    }

    const cleanEpic = epic.trim();

    // Check existing EPIC
    const existing = await prisma.voter.findUnique({
        where: { epic: cleanEpic }
    });
    if (existing && existing.id !== voterId) {
        throw new Error(`EPIC ${cleanEpic} पहले से मतदाता "${existing.name}" के पास दर्ज है।`);
    }

    const updateData: any = {
        epic: cleanEpic,
        eciStatus: 'RESOLVED_ADDED',
        verificationStatus: 'VERIFIED',
        status: 'Active',
        updatedByName: `${userName} (कार्ड जारी)`
    };

    if (boothNumber) {
        updateData.boothNumber = parseInt(boothNumber.toString());
    }

    await prisma.voter.update({
        where: { id: voterId },
        data: updateData
    });

    revalidatePath('/voters');
    revalidatePath('/eci-updates');
    return { success: true, message: 'कार्ड बन गया! मतदाता को सक्रिय मतदाता सूची में सफलतापूर्वक जोड़ दिया गया।' };
}

export async function resolveEciDeletion(voterId: number) {
    const session = await auth();
    const userName = session?.user?.name || 'ECI Team';

    await prisma.voter.update({
        where: { id: voterId },
        data: {
            eciStatus: 'RESOLVED_DELETED',
            status: 'Dead',
            updatedByName: `${userName} (नाम हटाया गया)`
        }
    });

    revalidatePath('/voters');
    revalidatePath('/eci-updates');
    return { success: true, message: 'मतदाता का नाम ECI से सफलतापूर्वक हटा दिया गया।' };
}

export async function rejectEciRequest(voterId: number) {
    const session = await auth();
    const userName = session?.user?.name || 'ECI Team';

    const voter = await prisma.voter.findUnique({ where: { id: voterId } });
    if (!voter) throw new Error("Voter not found");

    if (voter.eciStatus === 'NEW_REQUEST' || voter.eciStatus === 'NOT_IN_LIST') {
        // Delete pending addition request
        await prisma.voter.delete({ where: { id: voterId } });
    } else {
        // Revert deletion request back to active in-list
        await prisma.voter.update({
            where: { id: voterId },
            data: {
                eciStatus: 'IN_LIST',
                status: 'Active',
                updatedByName: `${userName} (अनुरोध अस्वीकृत/सक्रिय)`
            }
        });
    }

    revalidatePath('/voters');
    revalidatePath('/eci-updates');
    return { success: true, message: 'अनुरोध निरस्त कर दिया गया।' };
}
export async function getAllVotersForExport(assemblyId: number) {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !['ADMIN', 'SUPERADMIN', 'CANDIDATE'].includes(user.role)) {
        throw new Error("Unauthorized");
    }

    const voters = await (prisma.voter as any).findMany({
        where: { assemblyId },
        include: { votedParty: true },
        orderBy: { id: 'asc' }
    });

    return voters;
}
