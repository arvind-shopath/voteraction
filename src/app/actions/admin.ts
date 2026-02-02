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

export async function deleteAssembly(id: number) {
    const session = await auth();
    const role = (session?.user as any)?.role;

    // Allow SUPERADMIN and ADMIN to delete (as requested by user who needs the 'right')
    if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
        throw new Error("Unauthorized: Only Admins can delete assemblies.");
    }

    try {
        await prisma.$transaction(async (tx: any) => {
            // 1. Delete Indirect Dependent Children

            // Jansampark Visits
            const routes = await tx.jansamparkRoute.findMany({ where: { assemblyId: id }, select: { id: true } });
            if (routes.length > 0) {
                await tx.jansamparkVisit.deleteMany({ where: { routeId: { in: routes.map((r: any) => r.id) } } });
            }

            // Worker Social Task Proofs
            const socialTasks = await tx.workerSocialTask.findMany({ where: { assemblyId: id }, select: { id: true } });
            if (socialTasks.length > 0) {
                await tx.workerSocialTaskProof.deleteMany({ where: { taskId: { in: socialTasks.map((t: any) => t.id) } } });
            }

            // Voter Feedback (Linked to Campaign or Voter, both linked to Assembly)
            // Safer to delete by Voter IDs or Campaign IDs
            const campaigns = await tx.campaign.findMany({ where: { assemblyId: id }, select: { id: true } });
            if (campaigns.length > 0) {
                await tx.voterFeedback.deleteMany({ where: { campaignId: { in: campaigns.map((c: any) => c.id) } } });
            }
            // Also delete by voter if needed, but campaign deletion usually covers feedback in schema logic, 
            // but here we are manual. 
            // Let's delete all feedbacks where voter.assemblyId = id
            // Requires fetch first as deleteMany doesn't support deep relation filter in SQLite sometimes or ensures verify.
            // Actually, deleting Campaigns covers one leg. Deleting Voters covers the other.
            // We should delete feedbacks explicitly.
            // Simplified: Delete based on Campaigns first.

            // 2. Delete Direct Children (Order matters for some)
            await tx.systemLog.deleteMany({ where: { assemblyId: id } });
            await tx.userAssemblyAssignment.deleteMany({ where: { assemblyId: id } });
            await tx.socialSession.deleteMany({ where: { candidateId: id } }); // candidateId references Assembly
            await tx.electionHistory.deleteMany({ where: { assemblyId: id } });
            await tx.workerSocialTask.deleteMany({ where: { assemblyId: id } });
            await tx.campaignMaterial.deleteMany({ where: { assemblyId: id } });
            await tx.socialMediaApproval.deleteMany({ where: { assemblyId: id } });
            await tx.candidatePostRequest.deleteMany({ where: { assemblyId: id } });
            await tx.workerJanSampark.deleteMany({ where: { assemblyId: id } });
            await tx.task.deleteMany({ where: { assemblyId: id } }); // Worker Tasks
            await tx.jansamparkRoute.deleteMany({ where: { assemblyId: id } });
            await tx.publicRelation.deleteMany({ where: { assemblyId: id } });
            await tx.socialPost.deleteMany({ where: { assemblyId: id } });
            await tx.issue.deleteMany({ where: { assemblyId: id } });

            // Delete Voters (Big table)
            await tx.voter.deleteMany({ where: { assemblyId: id } });

            // Delete Import Jobs (must be after voters)
            await tx.importJob.deleteMany({ where: { assemblyId: id } });

            // Delete Workers
            // Workers might have relations to Users. 
            // We delete workers first.
            await tx.worker.deleteMany({ where: { assemblyId: id } });

            // Delete Booths
            await tx.booth.deleteMany({ where: { assemblyId: id } });

            // Delete Campaigns
            await tx.campaign.deleteMany({ where: { assemblyId: id } });

            // Delete Users attached to this assembly
            await tx.user.deleteMany({ where: { assemblyId: id } });

            // 3. Finally Delete Assembly
            await tx.assembly.delete({ where: { id } });
        });

        revalidatePath('/admin');
        revalidatePath('/admin/assemblies');
        revalidatePath('/admin/candidates');
        return { success: true };
    } catch (error: any) {
        console.error('Delete Assembly Error:', error);
        throw new Error(error.message || 'Failed to delete assembly');
    }
}

export async function toggleCandidateStatus(assemblyId: number) {
    const session = await auth();
    const role = (session?.user as any)?.role;

    if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
        throw new Error("Unauthorized: Only Admins can change status.");
    }

    const managers = await prisma.user.findMany({
        where: { assemblyId, role: 'MANAGER' }
    });

    if (managers.length === 0) return { success: false, message: 'No manager found for this assembly' };

    // Toggle based on the first manager found
    const currentStatus = managers[0].status;
    const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';

    await prisma.user.updateMany({
        where: { assemblyId, role: 'MANAGER' },
        data: { status: newStatus }
    });

    // Also toggle field workers and social team if needed, but usually just Manager blocks access
    // Updating all users in that assembly to match status is safer for "Deactivating Candidate"
    /*
    await prisma.user.updateMany({
        where: { assemblyId, role: { in: ['WORKER', 'SOCIAL_MEDIA'] } },
        data: { status: newStatus }
    });
    */

    revalidatePath('/admin/candidates');
    return { success: true, status: newStatus };
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

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export async function syncGitHubApps() {
    const session = await auth();
    const currentUser = session?.user as any;

    if (currentUser?.role !== 'SUPERADMIN') {
        throw new Error("Only Super Admin can sync apps.");
    }

    const token = process.env.GITHUB_ACCESS_TOKEN;
    const repo = "arvind-shopath/voteraction";
    const appsDir = path.join(process.cwd(), 'public', 'apps');

    if (!token) throw new Error("GitHub token not configured.");

    try {
        // 1. Get latest artifacts list
        const res = await fetch(`https://api.github.com/repos/${repo}/actions/artifacts`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!res.ok) throw new Error(`GitHub API Error: ${res.statusText}`);
        const data = await res.json();
        const artifacts = data.artifacts || [];

        const androidArtifact = artifacts.find((a: any) => a.name === "Voteraction-Android");
        const windowsArtifact = artifacts.find((a: any) => a.name === "Voteraction-Windows");

        if (!androidArtifact && !windowsArtifact) {
            throw new Error("No Voteraction app artifacts found on GitHub. Please check if the build has finished.");
        }

        const stats: any = {};

        // 2. Download and Unzip Function
        async function downloadAndExtract(artifact: any, targetFileName: string) {
            const artifactRes = await fetch(artifact.archive_download_url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!artifactRes.ok) throw new Error(`Failed to download ${artifact.name}`);

            const buffer = await artifactRes.arrayBuffer();
            const tempZip = path.join(appsDir, `${artifact.name}.zip`);

            if (!fs.existsSync(appsDir)) fs.mkdirSync(appsDir, { recursive: true });

            fs.writeFileSync(tempZip, Buffer.from(buffer));

            // Extract using CLI unzip
            await execAsync(`unzip -o ${tempZip} -d ${appsDir}`);

            // Cleanup zip
            fs.unlinkSync(tempZip);

            // Move/Rename file if needed (e.g., app-debug.apk -> voteraction.apk)
            // Note: unzip puts the files in the directory. We might need to find the .apk/.exe specifically.
            const files = fs.readdirSync(appsDir);
            const extractedFile = files.find(f =>
                (artifact.name.includes('Android') && f.endsWith('.apk')) ||
                (artifact.name.includes('Windows') && f.endsWith('.exe'))
            );

            if (extractedFile) {
                const finalPath = path.join(appsDir, targetFileName);
                // Ensure no permission issues
                fs.renameSync(path.join(appsDir, extractedFile), finalPath);
                fs.chmodSync(finalPath, 0o644);
                return true;
            }
            return false;
        }

        if (androidArtifact) {
            stats.android = await downloadAndExtract(androidArtifact, 'voteraction.apk');
        }
        if (windowsArtifact) {
            stats.windows = await downloadAndExtract(windowsArtifact, 'voteraction_setup.exe');
        }

        revalidatePath('/apps');
        return { success: true, stats };
    } catch (error: any) {
        console.error("Sync Error:", error);
        throw new Error(error.message || "Failed to sync apps from GitHub.");
    }
}
