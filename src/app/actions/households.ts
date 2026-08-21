'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

const db = prisma as any;

const BOOTH_CENTROIDS: Record<number, { lat: number; lng: number }> = {
    1: { lat: 25.5920, lng: 83.5680 }, // सौरी
    2: { lat: 25.5830, lng: 83.5780 }, // महुआबाग
    3: { lat: 25.5750, lng: 83.5820 }, // लंका / विशेश्वरगंज
    4: { lat: 25.5680, lng: 83.5620 }, // गोराबाजार
    5: { lat: 25.5980, lng: 83.5550 }, // रौज़ा / नुरुद्दीनपुरा
    6: { lat: 25.6050, lng: 83.5880 }, // रजदेपुर
    7: { lat: 25.5800, lng: 83.5750 }, // मिश्रबाजार
    8: { lat: 25.5600, lng: 83.5900 }, // बिंदोलिया
    9: { lat: 25.5880, lng: 83.6020 }, // सुखदेवपुर
    10: { lat: 25.5720, lng: 83.5700 }, // फतेहउल्लाहपुर
};

const CASTE_ALIASES: Record<string, string[]> = {
    'यादव': ['यादव', 'यादव/अहीर', 'अहीर'],
    'ब्राह्मण': ['ब्राह्मण', 'ब्राह्मण/पंडित'],
    'बिंद': ['बिंद', 'बिंद/निषाद', 'निषाद', 'मल्लाह', 'कश्यप', 'कश्यप/निषाद'],
    'कश्यप/निषाद': ['कश्यप/निषाद', 'निषाद', 'मल्लाह', 'कश्यप', 'बिंद', 'केवट', 'साहनी'],
    'राजभर': ['राजभर'],
    'मौर्य/कुशवाहा': ['मौर्य/कुशवाहा', 'मौर्य', 'कुशवाहा', 'सैनी', 'शाक्य'],
    'कुर्मी/पटेल': ['कुर्मी/पटेल', 'कुर्मी', 'पटेल', 'वर्मा', 'कटियार', 'गंगवार'],
    'प्रजापति/कुम्हार': ['प्रजापति/कुम्हार', 'प्रजापति', 'कुम्हार'],
    'विश्वकर्मा': ['विश्वकर्मा', 'लोहार', 'बढ़ई'],
    'पाल/बघेल': ['पाल/बघेल', 'पाल/गडरिया', 'पाल', 'गडरिया', 'बघेल'],
    'क्षत्रिय/राजपूत': ['क्षत्रिय/राजपूत', 'क्षत्रिय', 'राजपूत', 'ठाकुर', 'सिंह', 'चौहान', 'राठौड़', 'सोलंकी', 'तोमर', 'रघुवंशी'],
    'कायस्थ/लाला': ['कायस्थ/लाला', 'कायस्थ', 'लाला', 'श्रीवास्तव', 'सक्सेना', 'निगम', 'माथुर', 'भटनागर', 'अस्थाना', 'खरे'],
    'वैश्य/बनिया': ['वैश्य/बनिया', 'वैश्य', 'बनिया', 'गुप्ता', 'अग्रवाल', 'बंसल', 'जायसवाल', 'चौरसिया', 'साहू', 'केसरी', 'गर्ग', 'गोयल'],
    'जाटव/रविदास': ['जाटव/रविदास', 'जाटव/चमार', 'जाटव', 'चमार', 'भारती', 'गौतम', 'राम'],
    'पासी': ['पासी', 'सरोज', 'रावत'],
    'पासवान': ['पासवान'],
    'धोबी/कनौजिया': ['धोबी/कनौजिया', 'धोबी', 'कनौजिया'],
    'सोनकर/खटीक': ['सोनकर/खटीक', 'सोनकर', 'खटीक'],
    'वाल्मीकि': ['वाल्मीकि'],
    'कोरी': ['कोरी'],
    'मीणा': ['मीणा'],
    'गोंड': ['गोंड'],
    'खरवार': ['खरवार'],
    'अंसारी': ['अंसारी', 'अंसारी/जुलाहा'],
    'खान': ['खान', 'पठान/खान', 'पठान'],
    'सिद्दीकी': ['सिद्दीकी', 'शेख/सिद्दीकी', 'शेख'],
    'कुरैशी': ['कुरैशी', 'कुरैशी/कसाब'],
    'मंसूरी': ['मंसूरी', 'मंसूरी/धुनिया'],
    'सैयद': ['सैयद'],
    'शेख': ['शेख', 'शेख/सिद्दीकी'],
    'पठान': ['पठान', 'पठान/खान'],
    'मुस्लिम समुदाय': ['मुस्लिम समुदाय', 'अंसारी', 'खान', 'सिद्दीकी', 'कुरैशी', 'मंसूरी', 'सैयद', 'पठान', 'शेख']
};

export async function getHouseholds(filters: {
    search?: string;
    boothNumber?: number | string;
    village?: string;
    casteCategory?: string;
    caste?: string;
    familySize?: string;
    hasYouth?: boolean | string;
    locationStatus?: string;
    visitStatus?: string;
    sortBy?: string;
    assignedWorkerId?: number | string;
    page?: number;
    pageSize?: number;
    assemblyId?: number;
}) {
    const session = await auth();
    const user = session?.user as any;
    if (!user) return { households: [], totalCount: 0, page: 1, totalPages: 0, stats: null, options: { booths: [], villages: [] } };

    const targetAssemblyId = filters.assemblyId || user.assemblyId || 1;

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 24;
    const skip = (page - 1) * pageSize;

    const where: any = {
        assemblyId: targetAssemblyId
    };

    // If logged-in user is a worker, restrict strictly to their assigned booths
    if (user.role === 'WORKER' && user.id) {
        const workerProfile = await db.worker.findFirst({
            where: { userId: user.id }
        });
        if (workerProfile && workerProfile.assignedBooths) {
            const bNums = String(workerProfile.assignedBooths).split(',').map((x: string) => parseInt(x.trim())).filter((x: number) => !isNaN(x));
            if (bNums.length > 0) {
                where.boothNumber = { in: bNums };
            }
        }
    }

    if (filters.boothNumber && filters.boothNumber !== 'ALL' && filters.boothNumber !== 'सभी बूथ') {
        const bNum = parseInt(String(filters.boothNumber).replace('बूथ ', '').replace('बूथ #', '').replace('#', ''));
        if (!isNaN(bNum)) where.boothNumber = bNum;
    }

    if (filters.village && filters.village !== 'ALL' && filters.village !== 'सभी गांव') {
        where.village = filters.village;
    }

    if (filters.locationStatus && filters.locationStatus !== 'ALL' && filters.locationStatus !== 'सभी') {
        where.locationStatus = filters.locationStatus;
    }

    if (filters.visitStatus && filters.visitStatus !== 'ALL' && filters.visitStatus !== 'सभी') {
        if (filters.visitStatus === 'Visited' || filters.visitStatus === 'संपर्कित') {
            where.visits = { some: {} };
        } else if (filters.visitStatus === 'Pending' || filters.visitStatus === 'बाकी') {
            where.visits = { none: {} };
        }
    }

    // Caste Category Filter
    if (filters.casteCategory && filters.casteCategory !== 'ALL' && filters.casteCategory !== 'सभी वर्ग') {
        const catMap: Record<string, string[]> = {
            'सामान्य': ['General', 'सामान्य', 'GEN'],
            'ओबीसी': ['OBC', 'ओबीसी'],
            'एससी': ['SC', 'एससी'],
            'एसटी': ['ST', 'एसटी'],
            'मुस्लिम': ['Muslim', 'मुस्लिम', 'Other']
        };
        const mapped = catMap[filters.casteCategory] || [filters.casteCategory];
        where.voters = {
            ...(where.voters || {}),
            some: {
                ...(where.voters?.some || {}),
                casteCategory: { in: mapped }
            }
        };
    }

    // Specific Caste Filter
    if (filters.caste && filters.caste !== 'ALL' && filters.caste !== 'सभी जाति') {
        const variations = CASTE_ALIASES[filters.caste] || [filters.caste];
        where.voters = {
            ...(where.voters || {}),
            some: {
                ...(where.voters?.some || {}),
                OR: [
                    { caste: { in: variations } },
                    { subCaste: { in: variations } }
                ]
            }
        };
    }

    // Youth Filter (18-35 years)
    if (filters.hasYouth === true || filters.hasYouth === 'true' || filters.hasYouth === 'युवा') {
        where.voters = {
            ...(where.voters || {}),
            some: {
                ...(where.voters?.some || {}),
                age: { gte: 18, lte: 35 }
            }
        };
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

    // Sorting Order
    let orderBy: any = [{ boothNumber: 'asc' }, { id: 'asc' }];
    if (filters.sortBy === 'size_desc') {
        // Will be sorted in memory for count or id
        orderBy = [{ id: 'asc' }];
    } else if (filters.sortBy === 'recent_visit') {
        orderBy = [{ updatedAt: 'desc' }];
    }

    const [householdsRaw, totalCount, statsRaw, allBooths, allVillages] = await Promise.all([
        db.household.findMany({
            where,
            include: {
                voters: {
                    select: { id: true, name: true, gender: true, age: true, mobile: true, epic: true, isHead: true, caste: true, casteCategory: true, supportStatus: true }
                },
                assignedWorker: {
                    select: { id: true, name: true, mobile: true, type: true }
                },
                visits: {
                    orderBy: { visitDate: 'desc' },
                    take: 1
                }
            },
            orderBy,
            skip,
            take: pageSize
        }),
        db.household.count({ where }),
        db.household.groupBy({
            by: ['locationStatus'],
            where: { assemblyId: targetAssemblyId },
            _count: { id: true }
        }),
        db.household.findMany({
            where: { assemblyId: targetAssemblyId },
            select: { boothNumber: true },
            distinct: ['boothNumber'],
            orderBy: { boothNumber: 'asc' }
        }),
        db.household.findMany({
            where: { assemblyId: targetAssemblyId },
            select: { village: true },
            distinct: ['village'],
            orderBy: { village: 'asc' }
        })
    ]);

    let households = householdsRaw.map((h: any) => {
        const voters = h.voters || [];
        const youthCount = voters.filter((v: any) => v.age >= 18 && v.age <= 35).length;
        const headVoter = voters.find((v: any) => v.isHead) || voters[0] || null;
        
        return {
            ...h,
            voterCount: voters.length,
            youthCount,
            headVoter,
            primaryCaste: headVoter?.caste || voters[0]?.caste || 'सामान्य',
            lastVisit: h.visits?.[0] || null
        };
    });

    // Client-level family size filter if requested
    if (filters.familySize && filters.familySize !== 'ALL' && filters.familySize !== 'सभी परिवार') {
        if (filters.familySize === 'large' || filters.familySize === '7+') {
            households = households.filter((h: any) => h.voterCount >= 7);
        } else if (filters.familySize === 'medium' || filters.familySize === '4-6') {
            households = households.filter((h: any) => h.voterCount >= 4 && h.voterCount <= 6);
        } else if (filters.familySize === 'small' || filters.familySize === '1-3') {
            households = households.filter((h: any) => h.voterCount >= 1 && h.voterCount <= 3);
        }
    }

    if (filters.sortBy === 'size_desc') {
        households.sort((a: any, b: any) => b.voterCount - a.voterCount);
    } else if (filters.sortBy === 'size_asc') {
        households.sort((a: any, b: any) => a.voterCount - b.voterCount);
    } else if (filters.sortBy === 'youth_desc') {
        households.sort((a: any, b: any) => b.youthCount - a.youthCount);
    }

    const totalInAssembly = await db.household.count({ where: { assemblyId: targetAssemblyId } });
    const visitedCount = await db.household.count({
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

    statsRaw.forEach((s: any) => {
        if (s.locationStatus) statusCounts[s.locationStatus] = s._count.id;
    });

    return {
        households,
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / pageSize),
        options: {
            booths: allBooths.map((b: any) => b.boothNumber),
            villages: allVillages.map((v: any) => v.village).filter(Boolean)
        },
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

export async function getHouseholdMapPoints(filters?: {
    assemblyId?: number;
    boothNumber?: number;
    village?: string;
    casteCategory?: string;
    familySize?: string;
    hasYouth?: boolean | string;
    locationStatus?: string;
}) {
    const session = await auth();
    const user = session?.user as any;
    const targetAssemblyId = filters?.assemblyId || user?.assemblyId || 1;

    const where: any = {
        assemblyId: targetAssemblyId
    };

    // Worker role restriction
    if (user?.role === 'WORKER' && user?.id) {
        const workerProfile = await db.worker.findFirst({
            where: { userId: user.id }
        });
        if (workerProfile && workerProfile.assignedBooths) {
            const bNums = String(workerProfile.assignedBooths).split(',').map((x: string) => parseInt(x.trim())).filter((x: number) => !isNaN(x));
            if (bNums.length > 0) {
                where.boothNumber = { in: bNums };
            }
        }
    }

    if (filters?.boothNumber) {
        where.boothNumber = filters.boothNumber;
    }

    if (filters?.village && filters.village !== 'ALL' && filters.village !== 'सभी गांव') {
        where.village = filters.village;
    }

    if (filters?.locationStatus && filters.locationStatus !== 'ALL' && filters.locationStatus !== 'सभी') {
        where.locationStatus = filters.locationStatus;
    }

    if (filters?.casteCategory && filters.casteCategory !== 'ALL' && filters.casteCategory !== 'सभी वर्ग') {
        const catMap: Record<string, string[]> = {
            'सामान्य': ['General', 'सामान्य', 'GEN'],
            'ओबीसी': ['OBC', 'ओबीसी'],
            'एससी': ['SC', 'एससी'],
            'एसटी': ['ST', 'एसटी'],
            'मुस्लिम': ['Muslim', 'मुस्लिम', 'Other']
        };
        const mapped = catMap[filters.casteCategory] || [filters.casteCategory];
        where.voters = {
            some: {
                casteCategory: { in: mapped }
            }
        };
    }

    if (filters?.hasYouth === true || filters?.hasYouth === 'true') {
        where.voters = {
            some: {
                age: { gte: 18, lte: 35 }
            }
        };
    }

    const households = await db.household.findMany({
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
            voters: {
                select: { name: true, caste: true, age: true, isHead: true }
            },
            visits: {
                orderBy: { visitDate: 'desc' },
                take: 1,
                select: { status: true, visitDate: true }
            }
        },
        take: 3000
    });

    let mapped = households.map((h: any) => {
        const voters = h.voters || [];
        const youthCount = voters.filter((v: any) => v.age >= 18 && v.age <= 35).length;
        const headVoter = voters.find((v: any) => v.isHead) || voters[0] || null;

        return {
            id: h.id,
            code: h.householdCode,
            boothNumber: h.boothNumber,
            village: h.village || 'ग्राम',
            houseNumber: h.houseNumber || 'मकान',
            lat: h.latitude || 25.584,
            lng: h.longitude || 83.572,
            locationStatus: h.locationStatus,
            address: h.fullAddress,
            voterCount: voters.length,
            youthCount,
            headName: headVoter?.name || 'परिवार',
            caste: headVoter?.caste || voters[0]?.caste || 'सामान्य',
            lastVisitStatus: h.visits?.[0]?.status || 'Not_Visited',
            lastVisitDate: h.visits?.[0]?.visitDate || null
        };
    });

    if (filters?.familySize && filters.familySize !== 'ALL' && filters.familySize !== 'सभी') {
        if (filters.familySize === 'large' || filters.familySize === '7+') {
            mapped = mapped.filter((h: any) => h.voterCount >= 7);
        } else if (filters.familySize === 'medium' || filters.familySize === '4-6') {
            mapped = mapped.filter((h: any) => h.voterCount >= 4 && h.voterCount <= 6);
        } else if (filters.familySize === 'small' || filters.familySize === '1-3') {
            mapped = mapped.filter((h: any) => h.voterCount >= 1 && h.voterCount <= 3);
        }
    }

    return mapped;
}

export async function getHouseholdDetails(id: number) {
    const household = await db.household.findUnique({
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

    const updated = await db.household.update({
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

    const visit = await db.householdVisit.create({
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
        await db.household.update({
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
