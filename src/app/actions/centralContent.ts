'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

/**
 * MANAGER/ADMIN: Create a task for a central designer/editor
 */
export async function createCentralTask(data: {
    title: string;
    instructions?: string;
    inputMediaUrls?: string;
    designerId?: number;
    assemblyId?: number;
}) {
    const session = await auth();
    const user = session?.user as any;
    if (!user) throw new Error('Unauthorized');

    const task = await prisma.centralContentTask.create({
        data: {
            title: data.title,
            instructions: data.instructions,
            inputMediaUrls: data.inputMediaUrls,
            designerId: data.designerId,
            managerId: parseInt(user.id),
            assemblyId: data.assemblyId,
            status: 'ASSIGNED'
        }
    });

    revalidatePath('/social-sena');
    return task;
}

/**
 * GET TASKS based on role
 */
export async function getCentralTasks(filters: { status?: string; designerId?: number; managerId?: number; candidateId?: number }) {
    const session = await auth();
    if (!session?.user) return [];

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.designerId) where.designerId = filters.designerId;
    if (filters.managerId) where.managerId = filters.managerId;
    if (filters.candidateId) where.candidateId = filters.candidateId;

    return await prisma.centralContentTask.findMany({
        where,
        include: {
            designer: { select: { id: true, name: true, image: true } },
            manager: { select: { id: true, name: true, image: true } },
            candidate: { select: { id: true, name: true, image: true } },
            assembly: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
}

/**
 * DESIGNER: Submit work for review
 */
export async function submitCentralWork(taskId: number, outputMediaUrls: string) {
    const task = await prisma.centralContentTask.update({
        where: { id: taskId },
        data: {
            outputMediaUrls,
            status: 'SUBMITTED',
            updatedAt: new Date()
        }
    });

    revalidatePath('/social-sena');
    return task;
}

/**
 * MANAGER: Review work (Approve, Reject, Correction)
 */
export async function reviewCentralWork(taskId: number, status: 'APPROVED_BY_MANAGER' | 'REJECTED_BY_MANAGER' | 'CORRECTION_REQUESTED', feedback?: string) {
    const task = await prisma.centralContentTask.update({
        where: { id: taskId },
        data: {
            status,
            feedback,
            updatedAt: new Date()
        }
    });

    revalidatePath('/social-sena');
    return task;
}

/**
 * MANAGER: Send approved work to a specific Candidate
 */
export async function sendCentralToCandidate(taskId: number, candidateId: number) {
    // Verify it's already approved by manager or just update it
    const task = await prisma.centralContentTask.update({
        where: { id: taskId },
        data: {
            candidateId,
            status: 'SENT_TO_CANDIDATE',
            updatedAt: new Date()
        }
    });

    revalidatePath('/social-sena');
    revalidatePath('/social');
    return task;
}

/**
 * CANDIDATE: Final Approval/Rejection
 */
export async function candidateReviewCentralWork(taskId: number, approved: boolean, feedback?: string) {
    const task = await prisma.centralContentTask.update({
        where: { id: taskId },
        data: {
            status: approved ? 'APPROVED_BY_CANDIDATE' : 'REJECTED_BY_CANDIDATE',
            feedback,
            updatedAt: new Date()
        }
    });

    revalidatePath('/social');
    revalidatePath('/social-sena');
    return task;
}
