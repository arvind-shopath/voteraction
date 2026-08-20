import { NextResponse, NextRequest } from 'next/server';
import { prisma as prismaClient } from '@/lib/prisma';

const prisma = prismaClient as any;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { jobId, oldName, newName } = body;

        if (!jobId || !oldName || !newName) {
            return NextResponse.json({ error: 'jobId, oldName and newName are required' }, { status: 400 });
        }

        console.log(`Renaming village "${oldName}" to "${newName}" for Job #${jobId}`);

        // 1. Update Voters
        const updatedVoters = await prisma.voter.updateMany({
            where: {
                importJobId: jobId,
                village: oldName
            },
            data: {
                village: newName
            }
        });

        // 2. Update address/area field if it contains the old village name
        // SQLite doesn't support easy REPLACE in updateMany with Prisma, 
        // but we can fetch and update if needed, or just let it be as 'village' is the main field.
        // For simplicity and performance, we'll mainly rely on the 'village' field update.
        // If we want to be thorough:
        const votersWithArea = await prisma.voter.findMany({
            where: {
                importJobId: jobId,
                area: { contains: oldName }
            },
            select: { id: true, area: true }
        });

        for (const voter of votersWithArea) {
            if (voter.area) {
                const newArea = voter.area.replace(oldName, newName);
                await prisma.voter.update({
                    where: { id: voter.id },
                    data: { area: newArea }
                });
            }
        }

        return NextResponse.json({
            success: true,
            count: updatedVoters.count,
            message: `Successfully renamed "${oldName}" to "${newName}" for ${updatedVoters.count} voters.`
        });

    } catch (e: any) {
        console.error('Rename Village Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
