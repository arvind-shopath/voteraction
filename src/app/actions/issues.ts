'use server';

import { prisma as prismaClient } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const prisma = prismaClient as any;

import { auth } from '@/auth';

export async function getIssues(assemblyId: number) {
    const session = await auth();
    const user = session?.user as any;
    const userId = user?.id;
    const role = user?.role;
    const userName = user?.name;

    let where: any = { assemblyId };

    if (userId) {
        // Field roles restrictions
        if (role === 'PANNA_PRAMUKH' || role === 'WORKER') {
            // Only see issues they reported themselves
            where.reportedBy = userName;
        } else if (role === 'BOOTH_MANAGER') {
            // See issues for their booth
            const worker = await prisma.worker.findUnique({
                where: { userId: parseInt(userId) },
                include: { booth: true }
            });
            if (worker?.booth) {
                where.boothNumber = worker.booth.number;
            }
        }
        // ADMIN, MANAGER, SUPERADMIN etc. see all in assemblyId
    }

    return await prisma.issue.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });
}

export async function createIssue(data: {
    title: string,
    description?: string,
    category?: string,
    priority?: string,
    boothNumber?: number,
    assemblyId: number,
    reportedBy?: string,
    village?: string,
    area?: string,
    mediaUrls?: string,
    videoUrl?: string
}) {
    const session = await auth();
    const userName = session?.user?.name || 'Unknown';

    await prisma.issue.create({
        data: {
            ...data,
            updatedByName: userName
        }
    });
    revalidatePath('/issues');
}

export async function updateIssue(id: number, data: {
    title?: string,
    description?: string,
    status?: string,
    priority?: string,
    category?: string,
    village?: string,
    area?: string,
    mediaUrls?: string,
    videoUrl?: string,
    updatedByName?: string
}) {
    const session = await auth();
    const userName = session?.user?.name || 'Unknown';

    await prisma.issue.update({
        where: { id },
        data: {
            ...data,
            updatedByName: userName
        }
    });
    revalidatePath('/issues');
}

export async function deleteIssue(id: number) {
    await prisma.issue.delete({ where: { id } });
    revalidatePath('/issues');
}
