'use server';

import { prisma as prismaClient } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { validatePasswordStrength } from '@/lib/validation';

const prisma = prismaClient as any;

export async function getWorkerTasks(workerId: number) {
    return await prisma.task.findMany({
        where: { workerId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function updateTaskStatus(taskId: number, status: string, report?: string) {
    const data: any = { status };
    if (report) data.report = report;
    if (status === 'Completed') data.completedAt = new Date();

    await prisma.task.update({
        where: { id: taskId },
        data
    });

    if (status === 'Completed') {
        const task = await prisma.task.findUnique({
            where: { id: taskId }
        });
        if (task) {
            await addWorkerPoints(task.workerId, 'TASK_COMPLETED', 20, `Completed: ${task.title}`, true);
        }
    }

    revalidatePath('/worker/tasks');
}

export async function createWorkerTask(data: {
    title: string,
    description?: string,
    priority: string,
    workerId: number,
    assemblyId: number,
    dueDate?: Date
}) {
    await prisma.task.create({ data });
    revalidatePath('/workers');
}

export async function createBulkTasks(data: {
    title: string,
    description?: string,
    priority: string,
    workerIds: number[],
    assemblyId: number,
    mediaUrls?: string,
    dueDate?: Date
}) {
    const tasks = data.workerIds.map(workerId => ({
        title: data.title,
        description: data.description,
        priority: data.priority,
        workerId,
        assemblyId: data.assemblyId,
        mediaUrls: data.mediaUrls,
        dueDate: data.dueDate
    }));

    await prisma.task.createMany({ data: tasks });
    revalidatePath('/workers');
    revalidatePath('/tasks');
    revalidatePath('/worker/tasks');
}

export async function getWorkersInAssembly(assemblyId: number) {
    const session = await auth();
    const user_s = session?.user as any;

    // Support for Simulation: Check cookies for effective role
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const effectiveRole = cookieStore.get('effectiveRole')?.value || user_s?.role;
    const effectiveWorkerType = cookieStore.get('effectiveWorkerType')?.value;

    const campaignId = user_s?.campaignId;
    const role = effectiveRole;
    const userId = user_s?.id;

    let whereClause: any = {
        assemblyId,
        deletedAt: null, // Only active workers
        campaignId: campaignId || undefined
    };

    // Isolation: If Booth Manager, only see their own booth workers
    if (role === 'WORKER' && userId) {
        let currentUserWorker = await prisma.worker.findUnique({
            where: { userId: parseInt(userId) }
        });

        // Simulation Support for Admin: If simulating but no worker record, fetch first booth's manager
        if (!currentUserWorker) {
            const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
            if (user && ['ADMIN', 'SUPERADMIN'].includes(user.role)) {
                currentUserWorker = await prisma.worker.findFirst({
                    where: { assemblyId, type: 'BOOTH_MANAGER' },
                    orderBy: { id: 'asc' }
                });
            }
        }

        if (currentUserWorker?.type === 'BOOTH_MANAGER' && currentUserWorker.boothId) {
            whereClause.boothId = currentUserWorker.boothId;
            // Also only show Panna Pramukhs for this booth
            whereClause.type = 'PANNA_PRAMUKH';
        }
    }

    const workers = await prisma.worker.findMany({
        where: whereClause,
        include: {
            tasks: {
                where: { status: { not: 'Completed' } }
            },
            user: {
                select: { id: true, name: true, mobile: true, status: true }
            },
            booth: {
                select: { id: true, number: true, name: true, area: true }
            },
            _count: {
                select: {
                    assignedVoters: true
                }
            }
        },
        orderBy: { name: 'asc' }
    });

    // Optimized: Fetch all stats in bulk instead of per-worker queries
    const contactedStats = await prisma.voter.groupBy({
        by: ['pannaPramukhId'],
        where: {
            assemblyId,
            pannaPramukhId: { not: null },
            OR: [
                { mobile: { not: null } },
                { notes: { not: null } }
            ]
        },
        _count: { _all: true }
    });

    const votedStats = await prisma.voter.groupBy({
        by: ['pannaPramukhId'],
        where: {
            assemblyId,
            pannaPramukhId: { not: null },
            isVoted: true
        },
        _count: { _all: true }
    });

    const contactedMap = Object.fromEntries(contactedStats.map((s: any) => [s.pannaPramukhId, s._count._all]));
    const votedMap = Object.fromEntries(votedStats.map((s: any) => [s.pannaPramukhId, s._count._all]));

    return workers.map((w: any) => {
        const total = w._count?.assignedVoters || 0;
        const contacted = contactedMap[w.id] || 0;
        const voted = votedMap[w.id] || 0;

        return {
            ...w,
            stats: {
                totalVoters: total,
                contactedVoters: contacted,
                votedVoters: voted,
                progress: total > 0 ? Math.round((contacted / total) * 100) : 0,
                votingProgress: total > 0 ? Math.round((voted / total) * 100) : 0
            }
        };
    });
}

import bcrypt from 'bcryptjs';

export async function checkCreativeTeamStatus(assemblyId: number) {
    const creativeTeam = await prisma.userAssemblyAssignment.findFirst({
        where: {
            assemblyId,
            role: 'SOCIAL_MEDIA'
        }
    });
    return !!creativeTeam;
}

export async function createWorker(data: {
    name: string,
    mobile: string,
    type: string,
    assemblyId: number,
    boothId?: number,
    password?: string
}) {
    const session = await auth();
    const currentUser = session?.user as any;

    if (!['SUPERADMIN', 'ADMIN', 'CANDIDATE'].includes(currentUser?.role)) {
        throw new Error("You don't have permission to create workers.");
    }

    // If Candidate (MANAGER), they can only create workers for their own assembly
    if (currentUser?.role === 'CANDIDATE' && currentUser?.assemblyId !== data.assemblyId) {
        throw new Error("You can only create workers for your own assigned assembly.");
    }
    // 1. Create User Account if password is provided
    let userId = null;
    if (data.password && data.mobile) {
        const validation = validatePasswordStrength(data.password);
        if (!validation.isValid) {
            throw new Error(validation.message);
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ mobile: data.mobile }, { username: data.mobile }] }
        });

        if (existingUser) {
            // Update existing user to be a worker? Or just fail?
            // For now, let's assume if user exists, use that ID, but update password
            await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    password: hashedPassword,
                    role: 'WORKER',
                    status: 'Active'
                }
            });
            userId = existingUser.id;
        } else {
            const newUser = await prisma.user.create({
                data: {
                    name: data.name,
                    username: data.mobile,
                    mobile: data.mobile,
                    password: hashedPassword,
                    role: 'WORKER',
                    status: 'Active',
                    assemblyId: data.assemblyId
                }
            });
            userId = newUser.id;
        }
    }

    // 2. Create Worker
    const creatorCampaignId = currentUser?.campaignId;

    await prisma.worker.create({
        data: {
            name: data.name,
            mobile: data.mobile,
            type: data.type,
            assemblyId: data.assemblyId,
            campaignId: creatorCampaignId || null, // Inherit campaign from creator
            boothId: data.boothId || null,
            performanceScore: 0,
            userId: userId
        }
    });
    revalidatePath('/workers');
}

export async function updateWorkerPassword(workerId: number, password: string) {
    const worker = await prisma.worker.findUnique({
        where: { id: workerId },
        include: { user: true }
    });

    if (!worker) return { success: false, message: 'Worker not found' };

    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
        return { success: false, message: validation.message };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (worker.userId) {
        await prisma.user.update({
            where: { id: worker.userId },
            data: { password: hashedPassword, status: 'Active' }
        });
    } else if (worker.mobile) {
        // Create user if not exists
        const newUser = await prisma.user.create({
            data: {
                name: worker.name,
                username: worker.mobile,
                mobile: worker.mobile,
                password: hashedPassword,
                role: 'WORKER',
                status: 'Active',
                assemblyId: worker.assemblyId
            }
        });
        await prisma.worker.update({
            where: { id: workerId },
            data: { userId: newUser.id }
        });
    }

    return { success: true };
}

export async function updateWorkerBooth(workerId: number, boothId: number | null) {
    await prisma.worker.update({
        where: { id: workerId },
        data: { boothId }
    });
    revalidatePath('/workers');
}

export async function assignVotersToWorker(workerId: number, voterIds: number[]) {
    await prisma.voter.updateMany({
        where: {
            id: { in: voterIds }
        },
        data: {
            pannaPramukhId: workerId
        }
    });
    revalidatePath('/workers');
}

export async function autoAssignVotersByCount(workerId: number, count: number, assemblyId: number, boothNumber: number) {
    const unassigned = await prisma.voter.findMany({
        where: {
            assemblyId,
            boothNumber,
            pannaPramukhId: null
        },
        take: count,
        orderBy: { id: 'asc' }
    });

    const voterIds = unassigned.map((v: any) => v.id);

    if (voterIds.length > 0) {
        await prisma.voter.updateMany({
            where: { id: { in: voterIds } },
            data: { pannaPramukhId: workerId }
        });
    }

    revalidatePath('/workers');
    return { success: true, count: voterIds.length };
}

export async function getWorkerAssignedVoters(workerId: number) {
    return await prisma.voter.findMany({
        where: { pannaPramukhId: workerId }
    });
}

export async function bulkTransferVoters(fromWorkerId: number, toWorkerId: number) {
    await prisma.voter.updateMany({
        where: { pannaPramukhId: fromWorkerId },
        data: { pannaPramukhId: toWorkerId }
    });
    revalidatePath('/workers');
}

export async function updateWorker(id: number, data: {
    name?: string,
    mobile?: string,
    type?: string,
    boothId?: number | null
}) {
    const worker = await prisma.worker.update({
        where: { id },
        data
    });

    // Also update User if name/mobile changed
    if (worker.userId && (data.name || data.mobile)) {
        await prisma.user.update({
            where: { id: worker.userId },
            data: {
                name: data.name,
                mobile: data.mobile,
                username: data.mobile // Keep username same as mobile
            }
        });
    }

    revalidatePath('/workers');
}

// Soft Delete Worker - Data is preserved
export async function deleteWorker(workerId: number) {
    const worker = await prisma.worker.update({
        where: { id: workerId },
        data: {
            deletedAt: new Date() // Soft delete - mark as deleted but keep data
        }
    });

    // Also deactivate the associated user account (if exists)
    if (worker.userId) {
        await prisma.user.update({
            where: { id: worker.userId },
            data: {
                status: 'INACTIVE'
            }
        });
    }

    revalidatePath('/workers');
    return worker;
}

// Get only active (non-deleted) workers
export async function getActiveWorkers(assemblyId: number) {
    return await prisma.worker.findMany({
        where: {
            assemblyId,
            deletedAt: null // Only get workers that are NOT deleted
        },
        include: {
            booth: true,
            user: true,
            assignedVoters: true,
            tasks: true
        },
        orderBy: { name: 'asc' }
    });
}

// Restore a deleted worker
export async function restoreWorker(workerId: number) {
    const worker = await prisma.worker.update({
        where: { id: workerId },
        data: {
            deletedAt: null // Remove deletedAt to restore
        }
    });

    // Reactivate the user account
    if (worker.userId) {
        await prisma.user.update({
            where: { id: worker.userId },
            data: {
                status: 'ACTIVE'
            }
        });
    }

    revalidatePath('/workers');
    return worker;
}

export async function addWorkerPoints(id: number, action: string, points: number, description?: string, useWorkerId: boolean = false) {
    if (!id) return;

    try {
        const worker = useWorkerId
            ? await prisma.worker.findUnique({ where: { id } })
            : await prisma.worker.findUnique({ where: { userId: id } });

        if (!worker) return;

        await prisma.$transaction([
            prisma.worker.update({
                where: { id: worker.id },
                data: {
                    totalPoints: { increment: points },
                    performanceScore: { increment: points } // Sync for now
                }
            }),
            prisma.workerPointLog.create({
                data: {
                    workerId: worker.id,
                    points,
                    action,
                    description
                }
            })
        ]);

        revalidatePath('/dashboard');
        revalidatePath('/workers');
        return { success: true };
    } catch (e) {
        console.error('Failed to add points:', e);
        return { success: false };
    }
}

export async function getWorkerBooth(userId: number, assemblyId?: number) {
    const session = await auth();
    const user_s = session?.user as any;

    // Support for Simulation
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const effectiveRole = cookieStore.get('effectiveRole')?.value || user_s?.role;
    const effectiveWorkerType = cookieStore.get('effectiveWorkerType')?.value;

    let worker = await (prisma as any).worker.findUnique({
        where: { userId },
        include: { booth: true }
    });

    if (!worker || !worker.booth || (assemblyId && worker.assemblyId !== assemblyId)) {
        if (['ADMIN', 'SUPERADMIN'].includes(user_s?.role)) {
            const targetAssemblyId = assemblyId || user_s?.assemblyId || 1;
            worker = await (prisma as any).worker.findFirst({
                where: {
                    assemblyId: targetAssemblyId,
                    type: effectiveWorkerType === 'BOOTH_MANAGER' ? 'BOOTH_MANAGER' : undefined
                },
                include: { booth: true },
                orderBy: { id: 'asc' }
            });
        }
    }

    return worker?.booth || null;
}

// 📊 POINTS ANALYTICS

export async function getWorkerPointsSum(workerId: number, filter: {
    type: 'LIFETIME' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM',
    month?: number, // 0-11
    year?: number
}) {
    const where: any = { workerId };

    const now = new Date();

    if (filter.type === 'THIS_MONTH') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        where.createdAt = { gte: start, lte: end };
    } else if (filter.type === 'LAST_MONTH') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        where.createdAt = { gte: start, lte: end };
    } else if (filter.type === 'CUSTOM' && filter.year) {
        // If month provided, filter by month, else full year
        if (filter.month !== undefined) {
            const start = new Date(filter.year, filter.month, 1);
            const end = new Date(filter.year, filter.month + 1, 0);
            where.createdAt = { gte: start, lte: end };
        } else {
            const start = new Date(filter.year, 0, 1);
            const end = new Date(filter.year, 11, 31);
            where.createdAt = { gte: start, lte: end };
        }
    }

    const result = await prisma.workerPointLog.aggregate({
        where,
        _sum: { points: true }
    });

    return result._sum.points || 0;
}

export async function getAssemblyLeaderboard(assemblyId: number, filter: {
    type: 'LIFETIME' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM',
    month?: number,
    year?: number
}) {
    // 1. Get all workers in assembly
    const workers = await prisma.worker.findMany({
        where: {
            assemblyId,
            deletedAt: null
        },
        select: { id: true, name: true, type: true, mobile: true, totalPoints: true, booth: { select: { number: true } } }
    });

    // 2. If Lifetime, just sort by totalPoints (Optimized)
    if (filter.type === 'LIFETIME') {
        return workers
            .sort((a: any, b: any) => b.totalPoints - a.totalPoints)
            .map((w: any, index: number) => ({ ...w, points: w.totalPoints, rank: index + 1 }))
            .slice(0, 10); // Top 10
    }

    // 3. For time ranges, we must aggregate logs
    const workerIds = workers.map((w: any) => w.id);

    const where: any = { workerId: { in: workerIds } };
    const now = new Date();

    if (filter.type === 'THIS_MONTH') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        where.createdAt = { gte: start, lte: end };
    } else if (filter.type === 'LAST_MONTH') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        where.createdAt = { gte: start, lte: end };
    } else if (filter.type === 'CUSTOM' && filter.year) {
        if (filter.month !== undefined) {
            const start = new Date(filter.year, filter.month, 1);
            const end = new Date(filter.year, filter.month + 1, 0);
            where.createdAt = { gte: start, lte: end };
        } else {
            const start = new Date(filter.year, 0, 1);
            const end = new Date(filter.year, 11, 31);
            where.createdAt = { gte: start, lte: end };
        }
    }

    const logs = await prisma.workerPointLog.groupBy({
        by: ['workerId'],
        where,
        _sum: { points: true }
    });

    // Map scores to workers
    const scoreMap = new Map(logs.map((l: any) => [l.workerId, l._sum.points || 0]));

    const leaderboard = workers
        .map((w: any) => ({
            ...w,
            points: scoreMap.get(w.id) || 0
        }))
        .sort((a: any, b: any) => b.points - a.points)
        .slice(0, 10)
        .map((w: any, index: number) => ({ ...w, rank: index + 1 }));

    return leaderboard;
}
