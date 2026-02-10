'use server';

import { prisma as prismaClient } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import webpush from 'web-push';

const prisma = prismaClient as any;

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
    'mailto:support@creatiav.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

export async function getNotifications(userIdRaw?: any, assemblyIdRaw?: any) {
    const userId = userIdRaw ? parseInt(userIdRaw.toString()) : undefined;
    const assemblyId = assemblyIdRaw ? parseInt(assemblyIdRaw.toString()) : undefined;

    if (!userId && !assemblyId) return [];

    return await prisma.notification.findMany({
        where: {
            OR: [
                ...(userId ? [{ userId }] : []),
                ...(assemblyId ? [{ assemblyId, userId: null }] : [])
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    });
}

export async function savePushSubscription(userIdRaw: any, subscription: any) {
    const userId = parseInt(userIdRaw.toString());
    const { endpoint, keys } = subscription;
    await prisma.pushSubscription.upsert({
        where: { endpoint },
        update: { userId, p256dh: keys.p256dh, auth: keys.auth },
        create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth }
    });
    return { success: true };
}

export async function createNotification(data: {
    title: string,
    message: string,
    type?: string,
    userId?: number,
    assemblyId?: number,
    url?: string
}) {
    const notification = await prisma.notification.create({
        data: {
            title: data.title,
            message: data.message,
            type: data.type || "INFO",
            userId: data.userId,
            assemblyId: data.assemblyId,
            isRead: false
        }
    });

    // TRIGGER BASED: Send Push Notification to all subscribed devices of the user(s)
    const targetUserIds: number[] = [];
    if (data.userId) {
        targetUserIds.push(data.userId);
    } else if (data.assemblyId) {
        // If assembly wide, find all users in that assembly with specific roles (e.g. SOCIAL_MEDIA)
        // or just notify everyone in the assembly who is subscribed.
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { assemblyId: data.assemblyId },
                    { sharedAssignments: { some: { assemblyId: data.assemblyId } } },
                    { role: 'SUPERADMIN' }
                ]
            },
            select: { id: true }
        });
        targetUserIds.push(...users.map((u: any) => u.id));
    }

    if (targetUserIds.length > 0) {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId: { in: targetUserIds } }
        });

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth }
                    },
                    JSON.stringify({
                        title: data.title,
                        body: data.message,
                        url: data.url || '/'
                    })
                );
            } catch (error: any) {
                if (error.statusCode === 410 || error.statusCode === 404) {
                    // Subscription expired or no longer valid
                    await prisma.pushSubscription.delete({ where: { id: sub.id } });
                }
            }
        }
    }

    // In a real app we might use WebSockets here, but for now we'll rely on polling or revalidation
    revalidatePath('/');
    return notification;
}

export async function markAsRead(id: number) {
    await prisma.notification.update({
        where: { id },
        data: { isRead: true }
    });
    revalidatePath('/');
}

export async function markAllAsRead(userIdRaw?: any, assemblyIdRaw?: any) {
    const userId = userIdRaw ? parseInt(userIdRaw.toString()) : undefined;
    const assemblyId = assemblyIdRaw ? parseInt(assemblyIdRaw.toString()) : undefined;

    await prisma.notification.updateMany({
        where: {
            OR: [
                ...(userId ? [{ userId }] : []),
                ...(assemblyId ? [{ assemblyId, userId: null }] : [])
            ],
            isRead: false
        },
        data: { isRead: true }
    });
    revalidatePath('/');
}

export async function getVapidPublicKey() {
    return process.env.VAPID_PUBLIC_KEY;
}
