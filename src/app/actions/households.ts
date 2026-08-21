'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function getHouseholds(filters: {
    search?: string;
    boothNumber?: number | string;
    village?: string;
    locationStatus?: string;
    visitStatus?: string;
    assignedWorkerId?: number | string;
    page?: number;
    pageSize?: number;
    assemblyId?: number;
}) {
    const session = await auth();
    const user = session?.user as any;
    if (!user) return { households: [], totalCount: 0, page: 1, totalPages: 0, stats: null };

    const targetAssemblyId = filters.assemblyId || user.assemblyId || 1;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 25;
    const skip = (page - 1) * pageSize;

    const where: any = {
        assemblyId: targetAssemblyId
    };

    if (filters.boothNumber && filters.boothNumber !== 'ALL' && filters.boothNumber !== 'सभी बूथ') {
        const bNum = parseInt(String(filters.boothNumber).replace('बूथ ', ''));
        if (!isNaN(bNum)) where.boothNumber = bNum;
    }

    if (filters.village && filters.village !== 'ALL' && filters.village !== 'सभी गांव') {
        where.village = filters.village;
    }

    if (filters.locationStatus && filters.locationStatus !== 'ALL' && filters.locationStatus !== 'सभी') {
        where.locationStatus = filters.locationStatus;
    }

    if (filters.assignedWorkerId && filters.assignedWorkerId !== 'ALL') {
        const wId = parseInt(String(filters.assignedWorkerId));
        if (!isNaN(wId)) where.assignedWorkerId = wId;
    }

    if (filters.search) {
        where.OR = [
            { householdCode: { contains: filters.search } },
            { houseNumber: { contains: filters.search } },
            { village: { contains: filters.search } },
            { fullAddress: { contains: filters.search } },
            { voters: { some: { name: { contains: filters.search } } } },
            { voters: { some: { mobile: { contains: filters.search } } } },
            { voters: { some: { epic: { contains: filters.search } } } }
        ];
    }

    const [households, totalCount, statsRaw] = await Promise.all([
        prisma.household.findMany({
            where,
            include: {
                voters: {
                    select: { id: true, name: true, gender: true, age: true, mobile: true, epic: true, isHead: true, supportStatus: true }
                },
                assignedWorker: {
                    select: { id: true, name: true, mobile: true, type: true }
                },
                visits: {
                    orderBy: { visitDate: 'desc' },
                    take: 1
                }
            },
            orderBy: [{ boothNumber: 'asc' }, { houseNumber: 'asc' }],
            skip,
            take: pageSize
        }),
        prisma.household.count({ where }),
        prisma.household.groupBy({
            by: ['locationStatus'],
            where: { assemblyId: targetAssemblyId },
            _count: { id: true }
        })
    ]);

    const totalInAssembly = await prisma.household.count({ where: { assemblyId: targetAssemblyId } });
    const visitedCount = await prisma.household.count({
        where: {
            assemblyId: targetAssemblyId,
            visits: { some: {} }
        }
    });

    const statusCounts: Record<string, number> = {
        Field_Verified: 0,
        Geocoded: 0,
        Approximate: 0,
        Unmapped: 0
    };

    statsRaw.forEach(s => {
        if (s.locationStatus) statusCounts[s.locationStatus] = s._count.id;
    });

    return {
        households: households.map(h => ({
            ...h,
            voterCount: h.voters.length,
            headVoter: h.voters.find(v => v.isHead) || h.voters[0] || null,
            lastVisit: h.visits[0] || null
        })),
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / pageSize),
        stats: {
            total: totalInAssembly,
            fieldVerified: statusCounts.Field_Verified || 0,
            geocoded: statusCounts.Geocoded || 0,
            approximate: statusCounts.Approximate || 0,
            unmapped: statusCounts.Unmapped || 0,
            visited: visitedCount,
            pending: Math.max(0, totalInAssembly - visitedCount)
        }
    };
}

export async function getHouseholdDetails(id: number) {
    const household = await prisma.household.findUnique({
        where: { id },
        include: {
            voters: {
                orderBy: [{ isHead: 'desc' }, { age: 'desc' }]
            },
            assignedWorker: {
                select: { id: true, name: true, mobile: true, type: true }
            },
            visits: {
                include: {
                    worker: { select: { id: true, name: true, mobile: true } }
                },
                orderBy: { visitDate: 'desc' }
            },
            assembly: {
                select: { id: true, number: true, name: true, district: true, state: true }
            }
        }
    });

    return household;
}

export async function autoGenerateHouseholdsFromVoters(assemblyId: number) {
    const unlinkedVoters = await prisma.voter.findMany({
        where: {
            assemblyId,
            householdId: null
        },
        select: {
            id: true,
            boothNumber: true,
            village: true,
            villageHi: true,
            villageEn: true,
            houseNumber: true,
            houseNoClean: true,
            fullAddressHi: true,
            fullAddressEn: true
        }
    });

    if (unlinkedVoters.length === 0) {
        return { success: true, count: 0, message: 'सभी मतदाता पहले से ही हाउसहोल्ड से जुड़े हैं।' };
    }

    // Group voters by (boothNumber, village, houseNumber)
    const groups = new Map<string, typeof unlinkedVoters>();
    for (const v of unlinkedVoters) {
        const bNum = v.boothNumber || 1;
        const vil = (v.village || v.villageHi || v.villageEn || 'सामान्य').trim();
        const hNo = (v.houseNoClean || v.houseNumber || '0').trim();
        const key = `${bNum}__${vil}__${hNo}`;

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(v);
    }

    let createdCount = 0;
    let voterLinkedCount = 0;

    for (const [key, votersInGroup] of groups.entries()) {
        const [bNumStr, village, houseNo] = key.split('__');
        const boothNumber = parseInt(bNumStr) || 1;
        const firstVoter = votersInGroup[0];

        // Check if household already exists
        let household = await prisma.household.findFirst({
            where: {
                assemblyId,
                boothNumber,
                village,
                houseNumber: houseNo
            }
        });

        if (!household) {
            const countInBooth = await prisma.household.count({
                where: { assemblyId, boothNumber }
            });
            const code = `H-${boothNumber}-${String(countInBooth + 1).padStart(4, '0')}`;

            // Mock approximate village/booth coords around UP if not set
            const baseLat = 25.58 + (boothNumber * 0.002);
            const baseLng = 83.57 + (boothNumber * 0.002);

            household = await prisma.household.create({
                data: {
                    householdCode: code,
                    assemblyId,
                    boothNumber,
                    village,
                    villageHi: firstVoter.villageHi || village,
                    villageEn: firstVoter.villageEn || village,
                    houseNumber: houseNo,
                    fullAddress: firstVoter.fullAddressHi || firstVoter.fullAddressEn || `${village}, मकान नं ${houseNo}`,
                    locationStatus: 'Approximate',
                    latitude: baseLat,
                    longitude: baseLng
                }
            });
            createdCount++;
        }

        // Link voters to this household
        const voterIds = votersInGroup.map(v => v.id);
        await prisma.voter.updateMany({
            where: { id: { in: voterIds } },
            data: { householdId: household.id }
        });
        voterLinkedCount += voterIds.length;
    }

    revalidatePath('/households');
    revalidatePath('/households/map');
    return {
        success: true,
        createdHouseholds: createdCount,
        linkedVoters: voterLinkedCount,
        message: `${createdCount} नए हाउसहोल्ड बने और ${voterLinkedCount} मतदाता लिंक किए गए।`
    };
}

export async function verifyHouseholdLocation(data: {
    householdId: number;
    latitude: number;
    longitude: number;
    workerId?: number;
    notes?: string;
}) {
    const session = await auth();
    const user = session?.user as any;
    const workerId = data.workerId || user?.workerId || null;

    const updated = await prisma.household.update({
        where: { id: data.householdId },
        data: {
            latitude: data.latitude,
            longitude: data.longitude,
            locationStatus: 'Field_Verified',
            verifiedAt: new Date(),
            verifiedByWorkerId: workerId,
            notes: data.notes ? data.notes : undefined
        }
    });

    revalidatePath('/households');
    revalidatePath('/households/map');
    return { success: true, household: updated };
}

export async function recordHouseholdVisit(data: {
    householdId: number;
    status: string; // Visited, Revisit_Required, Unable_to_Contact, Scheduled_Followup
    notes?: string;
    latitude?: number;
    longitude?: number;
    workerId?: number;
    eventId?: number;
}) {
    const session = await auth();
    const user = session?.user as any;
    const workerId = data.workerId || user?.workerId || null;

    const visit = await prisma.householdVisit.create({
        data: {
            householdId: data.householdId,
            workerId,
            status: data.status || 'Visited',
            notes: data.notes || null,
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            eventId: data.eventId || null
        }
    });

    // If coordinates were submitted with visit, update household location
    if (data.latitude && data.longitude) {
        await prisma.household.update({
            where: { id: data.householdId },
            data: {
                latitude: data.latitude,
                longitude: data.longitude,
                locationStatus: 'Field_Verified',
                verifiedAt: new Date(),
                verifiedByWorkerId: workerId
            }
        });
    }

    revalidatePath('/households');
    revalidatePath('/households/map');
    return { success: true, visit };
}

export async function assignHouseholdWorker(householdId: number, workerId: number | null) {
    const updated = await prisma.household.update({
        where: { id: householdId },
        data: { assignedWorkerId: workerId }
    });

    revalidatePath('/households');
    return { success: true, household: updated };
}

export async function getHouseholdMapPoints(assemblyId?: number, boothNumber?: number) {
    const session = await auth();
    const user = session?.user as any;
    const targetAssemblyId = assemblyId || user?.assemblyId || 1;

    const where: any = {
        assemblyId: targetAssemblyId
    };

    if (boothNumber) {
        where.boothNumber = boothNumber;
    }

    const households = await prisma.household.findMany({
        where,
        select: {
            id: true,
            householdCode: true,
            boothNumber: true,
            village: true,
            houseNumber: true,
            latitude: true,
            longitude: true,
            locationStatus: true,
            fullAddress: true,
            _count: { select: { voters: true } },
            visits: {
                orderBy: { visitDate: 'desc' },
                take: 1,
                select: { status: true, visitDate: true }
            }
        },
        take: 2000
    });

    return households.map(h => ({
        id: h.id,
        code: h.householdCode,
        boothNumber: h.boothNumber,
        village: h.village || 'ग्राम',
        houseNumber: h.houseNumber || 'मकान',
        lat: h.latitude || 25.58,
        lng: h.longitude || 83.57,
        locationStatus: h.locationStatus,
        address: h.fullAddress,
        voterCount: h._count.voters,
        lastVisitStatus: h.visits[0]?.status || 'Not_Visited',
        lastVisitDate: h.visits[0]?.visitDate || null
    }));
}
