'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function getDeveloperMode() {
    try {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: 'developer_mode' }
        });
        return setting?.value === 'true';
    } catch (error) {
        return false;
    }
}

export async function toggleDeveloperMode() {
    const session = await auth();
    const user = session?.user as any;

    if (user?.role !== 'SUPERADMIN') {
        throw new Error('Unauthorized');
    }

    try {
        const currentSetting = await prisma.systemSettings.findUnique({
            where: { key: 'developer_mode' }
        });

        const newValue = currentSetting?.value === 'true' ? 'false' : 'true';

        await prisma.systemSettings.upsert({
            where: { key: 'developer_mode' },
            update: {
                value: newValue,
                updatedBy: parseInt(user.id),
                updatedAt: new Date(),
            },
            create: {
                key: 'developer_mode',
                value: newValue,
                description: 'Controls whether the app is in developer maintenance mode',
                updatedBy: parseInt(user.id),
            },
        });

        return { success: true, enabled: newValue === 'true' };
    } catch (error) {
        console.error('Error toggling developer mode:', error);
        return { success: false, error: 'Failed to toggle developer mode' };
    }
}
