'use server';

import { prisma as prismaClient } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

const prisma = prismaClient as any;

export async function getUserProfile(userId: number) {
    try {
        return await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                image: true,
                mobile: true,
                role: true,
                username: true
            }
        });
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function updateUserProfile(data: { name: string, image?: string | null }) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    const userId = parseInt((session.user as any).id);

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                image: data.image
            }
        });

        revalidatePath('/profile');
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}
