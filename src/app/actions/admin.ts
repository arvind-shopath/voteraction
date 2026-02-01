'use server';

import { prisma as prismaClient } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';

const prisma = prismaClient as any;

// Assembly Actions
export async function getAssemblies() {
    return await prisma.assembly.findMany({
        include: {
            _count: {
                select: { voters: true, booths: true, users: true, campaigns: true }
            },
            electionHistory: true,
            campaigns: {
                include: { assembly: true }
            },
            users: {
                select: {
                    id: true,
                    role: true,
                    status: true,
                    name: true
                }
            },
            sharedAssignments: {
                include: {
                    user: {
                        select: {
                            id: true,
                            role: true,
                            status: true,
                            name: true
                        }
                    }
                }
            }
        }
    });
}

export async function createAssembly(data: {
    number: number,
    name: string,
    district: string,
    state: string,
    historicalResults?: string,
    casteEquation?: string,
    electionHistory?: any[]
}) {
    const { electionHistory, ...rest } = data;
    const assembly = await prisma.assembly.create({ data: rest });

    if (electionHistory && Array.isArray(electionHistory) && electionHistory.length > 0) {
        for (const h of electionHistory) {
            await prisma.electionHistory.create({
                data: {
                    year: parseInt(h.year?.toString() || '0'),
                    partyName: h.partyName || 'Unknown',
                    candidateName: h.candidateName || 'Unknown',
                    votesReceived: parseInt(h.votesReceived?.toString() || '0'),
                    votePercentage: (h.votePercentage && !isNaN(parseFloat(h.votePercentage.toString())))
                        ? parseFloat(h.votePercentage.toString())
                        : null,
                    assemblyId: assembly.id
                }
            });
        }
    }

    revalidatePath('/admin/assemblies');
    return assembly;
}

export async function updateAssembly(id: number, data: {
    number?: number,
    name?: string,
    district?: string,
    state?: string,
    historicalResults?: string,
    casteEquation?: string,
    electionHistory?: any[],
    party?: string,
    themeColor?: string,
    candidateName?: string,
    candidateImageUrl?: string,
    enabledFeatures?: string,
    // Campaign Info
    importantAreas?: string,
    importantNewspapers?: string,
    campaignTags?: string,
    candidateBusiness?: string,
    importantIssues?: string,
    importantCastes?: string
}) {
    try {
        const { electionHistory, ...rest } = data;

        const updateData: any = {
            name: rest.name,
            number: rest.number,
            district: rest.district,
            state: rest.state,
            party: rest.party,
            themeColor: rest.themeColor,
            historicalResults: rest.historicalResults,
            casteEquation: rest.casteEquation,
            candidateName: rest.candidateName,
            candidateImageUrl: rest.candidateImageUrl,
            enabledFeatures: rest.enabledFeatures,
            // Campaign Info
            importantAreas: rest.importantAreas,
            importantNewspapers: rest.importantNewspapers,
            campaignTags: rest.campaignTags,
            candidateBusiness: rest.candidateBusiness,
            importantIssues: rest.importantIssues,
            importantCastes: rest.importantCastes
        };

        // Remove undefined fields to avoid overriding existing data with undefined
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        return await prisma.$transaction(async (tx: any) => {
            const assembly = await tx.assembly.update({
                where: { id },
                data: updateData
            });

            if (electionHistory && Array.isArray(electionHistory)) {
                await tx.electionHistory.deleteMany({ where: { assemblyId: id } });

                // Use individual creates because createMany might have issues on this SQLite version/setup
                for (const h of electionHistory) {
                    await tx.electionHistory.create({
                        data: {
                            year: parseInt(h.year?.toString() || '0'),
                            partyName: h.partyName || 'Unknown',
                            candidateName: h.candidateName || 'Unknown',
                            votesReceived: parseInt(h.votesReceived?.toString() || '0'),
                            votePercentage: (h.votePercentage !== undefined && h.votePercentage !== null && !isNaN(parseFloat(h.votePercentage.toString())))
                                ? parseFloat(h.votePercentage.toString())
                                : null,
                            assemblyId: id
                        }
                    });
                }
            }

            revalidatePath('/admin/assemblies');
            revalidatePath('/dashboard');
            return assembly;
        });
    } catch (error: any) {
        console.error('updateAssembly Transaction Error:', error);
        throw new Error(error.message || 'Failed to update assembly details');
    }
}

// User Actions
export async function getUsers() {
    return await prisma.user.findMany({
        include: { assembly: true, campaign: true, worker: true }
    });
}

export async function createUserSecure(data: {
    mobile: string,
    name: string,
    role: string,
    password?: string,
    assemblyId?: number,
    status?: string
}) {
    const session = await auth();
    const currentUser = session?.user as any;

    // Only SUPERADMIN can create ADMIN, SUPERADMIN, SOCIAL_MEDIA, MANAGER
    if (['ADMIN', 'SUPERADMIN', 'SOCIAL_MEDIA', 'MANAGER'].includes(data.role)) {
        if (currentUser?.role !== 'SUPERADMIN') {
            throw new Error("You don't have permission to create this type of user.");
        }
    }

    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;

    const user = await prisma.user.create({
        data: {
            mobile: data.mobile,
            username: data.mobile,
            name: data.name,
            role: data.role,
            password: hashedPassword,
            assemblyId: data.assemblyId || null,
            status: data.status || 'Active'
        }
    });

    revalidatePath('/admin/users');
    return user;
}

export async function secureUpdateUserPassword(userId: number, newPassword: string) {
    const session = await auth();
    const currentUser = session?.user as any;

    // Only SUPERADMIN can change passwords as per user request
    if (currentUser?.role !== 'SUPERADMIN') {
        throw new Error("Only Super Admin can change passwords.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });

    revalidatePath('/admin/users');
    return { success: true };
}

export async function deleteUser(id: number) {
    await prisma.user.delete({ where: { id } });
    revalidatePath('/admin/users');
}

export async function toggleUserStatus(id: number, currentStatus: string) {
    const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
    const user = await prisma.user.update({
        where: { id },
        data: { status: newStatus }
    });

    if ((user.role === 'MANAGER' || user.role === 'ADMIN' || user.role === 'SUPERADMIN') && user.assemblyId) {
        await prisma.user.updateMany({
            where: {
                assemblyId: user.assemblyId,
                role: { in: ['WORKER', 'SOCIAL_MEDIA'] }
            },
            data: { status: newStatus }
        });
    }

    await prisma.systemLog.create({
        data: {
            action: `USER_${newStatus.toUpperCase()}`,
            details: `User ${user.username} was ${newStatus.toLowerCase()}`,
            assemblyId: user.assemblyId
        }
    });

    revalidatePath('/admin/users');
}

export async function setUserRole(id: number, role: string) {
    // Only Arvind Shukla can be SUPERADMIN
    if (role === 'SUPERADMIN') {
        const user = await prisma.user.findUnique({ where: { id } });
        // Standard check: only Arvind can hold it.
        if (user?.email !== 'arvind.shukla64@gmail.com') {
            throw new Error("Only Arvind Shukla can be assigned the Super Admin role.");
        }
    }

    await prisma.user.update({
        where: { id },
        data: { role }
    });
    revalidatePath('/admin/users');
}

export async function setUserStatus(id: number, status: string) {
    await prisma.user.update({
        where: { id },
        data: { status }
    });
    revalidatePath('/admin/users');
}

export async function updateUserName(id: number, name: string) {
    await prisma.user.update({
        where: { id },
        data: { name }
    });
    revalidatePath('/admin/users');
}

export async function assignUserToAssembly(userId: number, assemblyId: number | null) {
    await prisma.user.update({
        where: { id: userId },
        data: { assemblyId, campaignId: null } // Reset campaign when assembly changes
    });
    revalidatePath('/admin/users');
    revalidatePath('/admin/candidates');
    if (assemblyId) {
        revalidatePath(`/admin/candidates/${assemblyId}`);
    }
}

// Assign entire team (e.g., all Social Media users) to an assembly
// Uses UserAssemblyAssignment table for many-to-many relationships
export async function assignTeamToAssembly(role: string, assemblyId: number) {
    // Get all active users with this role
    const users = await prisma.user.findMany({
        where: {
            role: role,
            status: 'Active'
        }
    });

    // Create UserAssemblyAssignment records for each user
    for (const user of users) {
        await prisma.userAssemblyAssignment.upsert({
            where: {
                userId_assemblyId_role: {
                    userId: user.id,
                    assemblyId: assemblyId,
                    role: role
                }
            },
            update: {}, // Already exists, no update needed
            create: {
                userId: user.id,
                assemblyId: assemblyId,
                role: role
            }
        });
    }

    revalidatePath('/admin/users');
    revalidatePath('/admin/candidates');
    revalidatePath(`/admin/candidates/${assemblyId}`);
}


export async function getCampaigns(assemblyId?: number) {
    const where = assemblyId ? { assemblyId } : {};
    return await prisma.campaign.findMany({
        where,
        include: { assembly: true, _count: { select: { users: true, workers: true } } }
    });
}

export async function createCampaign(data: { name: string, assemblyId: number, candidateName?: string }) {
    const campaign = await prisma.campaign.create({ data });
    revalidatePath('/admin/campaigns');
    revalidatePath('/admin/users');
    return campaign;
}

export async function assignUserToCampaign(userId: number, campaignId: number | null) {
    await prisma.user.update({
        where: { id: userId },
        data: { campaignId }
    });
    revalidatePath('/admin/users');
}

export async function setUserWorkerType(userId: number, workerType: string | null) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { worker: true }
    });

    if (!user) return;

    if (user.worker) {
        await prisma.worker.update({
            where: { id: user.worker.id },
            data: { type: workerType || 'FIELD' }
        });
    } else if (workerType) {
        // Create worker if doesn't exist but a type is provided
        await prisma.worker.create({
            data: {
                name: user.name || user.username || 'User',
                userId: user.id,
                type: workerType,
                assemblyId: user.assemblyId || (await prisma.assembly.findFirst())?.id || 1, // Fallback assembly
            }
        });
    }

    revalidatePath('/admin/users');
}

export async function getAdminStats() {
    const [totalAssemblies, totalUsers, totalVoters, totalIssues, totalWorkers] = await Promise.all([
        prisma.assembly.count(),
        prisma.user.count(),
        prisma.voter.count(),
        prisma.issue.count(),
        prisma.worker.count()
    ]);

    const pendingIssues = await prisma.issue.count({
        where: { status: { not: 'Closed' } }
    });

    return {
        totalAssemblies,
        totalUsers,
        totalVoters,
        totalIssues,
        pendingIssues,
        totalWorkers
    };
}

export async function getSystemLogs(limit = 10) {
    return await prisma.systemLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            user: true,
            assembly: true
        }
    });
}

export async function logAction(data: { action: string, details?: string, userId?: number, assemblyId?: number }) {
    return await prisma.systemLog.create({ data });
}

export async function getGlobalIssues() {
    return await prisma.issue.findMany({
        orderBy: { createdAt: 'desc' },
        include: { assembly: true }
    });
}

export async function getParties() {
    return await prisma.party.findMany({
        orderBy: { name: 'asc' }
    });
}

export async function createParty(data: { name: string, color: string, logo?: string }) {
    const party = await prisma.party.create({ data });
    revalidatePath('/admin/parties');
    revalidatePath('/settings');
    return party;
}

export async function deleteParty(id: number) {
    await prisma.party.delete({ where: { id } });
    revalidatePath('/admin/parties');
}

export async function updateElectionDate(assemblyId: number, date: Date) {
    await prisma.assembly.update({
        where: { id: assemblyId },
        data: { electionDate: date }
    });
    revalidatePath('/admin');
    revalidatePath('/dashboard');
}

export async function getAssemblyInfo(assemblyId: number) {
    return await prisma.assembly.findUnique({
        where: { id: assemblyId }
    });
}
