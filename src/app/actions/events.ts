'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

const db = prisma as any;

export async function getEvents(filters: {
    search?: string;
    type?: string;
    status?: string;
    priority?: string;
    assemblyId?: number;
    startDate?: string;
    endDate?: string;
}) {
    const session = await auth();
    const user = session?.user as any;
    if (!user) return { events: [], stats: null };

    const targetAssemblyId = filters.assemblyId || user.assemblyId || 1;

    const where: any = {
        assemblyId: targetAssemblyId
    };

    if (filters.type && filters.type !== 'ALL' && filters.type !== 'सभी प्रकार') {
        where.type = filters.type;
    }

    if (filters.status && filters.status !== 'ALL' && filters.status !== 'सभी स्थिति') {
        where.status = filters.status;
    }

    if (filters.priority && filters.priority !== 'ALL') {
        where.priority = filters.priority;
    }

    if (filters.search) {
        where.OR = [
            { title: { contains: filters.search } },
            { location: { contains: filters.search } },
            { address: { contains: filters.search } },
            { responsibleName: { contains: filters.search } },
            { description: { contains: filters.search } }
        ];
    }

    const events = await db.event.findMany({
        where,
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        include: {
            visits: {
                select: { id: true, status: true }
            }
        }
    });

    const now = new Date();
    const allEventsInAssembly = await db.event.findMany({
        where: { assemblyId: targetAssemblyId },
        select: { status: true, expectedAttendance: true, actualAttendance: true, date: true }
    });

    let totalExpected = 0;
    let totalActual = 0;
    let upcomingCount = 0;
    let completedCount = 0;
    let ongoingCount = 0;

    allEventsInAssembly.forEach((e: any) => {
        totalExpected += e.expectedAttendance || 0;
        totalActual += e.actualAttendance || 0;
        if (e.status === 'Completed') completedCount++;
        else if (e.status === 'Ongoing') ongoingCount++;
        else upcomingCount++;
    });

    return {
        events: events.map((e: any) => ({
            ...e,
            visitCount: e.visits?.length || 0
        })),
        stats: {
            total: allEventsInAssembly.length,
            upcoming: upcomingCount,
            completed: completedCount,
            ongoing: ongoingCount,
            totalExpectedAttendance: totalExpected,
            totalActualAttendance: totalActual
        }
    };
}

export async function getEventById(id: number) {
    const event = await db.event.findUnique({
        where: { id },
        include: {
            assembly: {
                select: { id: true, number: true, name: true }
            },
            visits: {
                include: {
                    household: {
                        select: { id: true, householdCode: true, village: true, houseNumber: true }
                    },
                    worker: {
                        select: { id: true, name: true, mobile: true }
                    }
                }
            }
        }
    });

    return event;
}

export async function createEvent(data: {
    title: string;
    type?: string;
    date: string | Date;
    startTime?: string;
    endTime?: string;
    location?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    responsibleName?: string;
    responsibleMobile?: string;
    responsibleWorkerId?: number;
    assignedWorkerIds?: number[];
    expectedAttendance?: number;
    priority?: string;
    description?: string;
    notes?: string;
    assemblyId?: number;
}) {
    const session = await auth();
    const user = session?.user as any;
    const targetAssemblyId = data.assemblyId || user?.assemblyId || 1;

    const event = await db.event.create({
        data: {
            title: data.title,
            type: data.type || 'Public_Meeting',
            assemblyId: targetAssemblyId,
            date: new Date(data.date),
            startTime: data.startTime || null,
            endTime: data.endTime || null,
            location: data.location || null,
            address: data.address || null,
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            responsibleName: data.responsibleName || null,
            responsibleMobile: data.responsibleMobile || null,
            responsibleWorkerId: data.responsibleWorkerId || null,
            assignedWorkerIds: data.assignedWorkerIds ? JSON.stringify(data.assignedWorkerIds) : null,
            expectedAttendance: data.expectedAttendance || 0,
            actualAttendance: 0,
            status: 'Scheduled',
            priority: data.priority || 'Medium',
            description: data.description || null,
            notes: data.notes || null
        }
    });

    revalidatePath('/events');
    revalidatePath('/campaign-progress');
    return { success: true, event };
}

export async function updateEvent(id: number, data: any) {
    if (data.date) {
        data.date = new Date(data.date);
    }
    if (data.assignedWorkerIds && Array.isArray(data.assignedWorkerIds)) {
        data.assignedWorkerIds = JSON.stringify(data.assignedWorkerIds);
    }

    const event = await db.event.update({
        where: { id },
        data
    });

    revalidatePath('/events');
    revalidatePath('/campaign-progress');
    return { success: true, event };
}

export async function deleteEvent(id: number) {
    await db.event.delete({ where: { id } });
    revalidatePath('/events');
    revalidatePath('/campaign-progress');
    return { success: true };
}

export async function recordEventAttendance(id: number, data: {
    actualAttendance: number;
    notes?: string;
    attachments?: string[];
}) {
    const event = await db.event.update({
        where: { id },
        data: {
            actualAttendance: data.actualAttendance,
            status: 'Completed',
            notes: data.notes ? data.notes : undefined,
            attachments: data.attachments ? JSON.stringify(data.attachments) : undefined
        }
    });

    revalidatePath('/events');
    revalidatePath('/campaign-progress');
    return { success: true, event };
}
