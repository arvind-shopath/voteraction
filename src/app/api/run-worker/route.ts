import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processImportQueue } from '@/lib/queue-processor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        // Reset all FAILED jobs back to PENDING so they get processed by our pure JS pdf-parse engine
        const resetResult = await (prisma as any).importJob.updateMany({
            where: { status: 'FAILED' },
            data: { status: 'PENDING', errorMessage: null, progress: 0 }
        });

        // Trigger queue worker loop
        processImportQueue().catch((err) => console.error('[WORKER BACKGROUND ERR]:', err));

        const voterCount = await (prisma as any).voter.count();
        const boothCount = await (prisma as any).booth.count();

        const jobCounts = await (prisma as any).importJob.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        const activeJob = await (prisma as any).importJob.findFirst({
            where: { status: 'PROCESSING' },
            select: { id: true, assemblyId: true, fileName: true, progress: true, totalVoters: true }
        });

        return NextResponse.json({
            ts: Date.now(),
            resetCount: resetResult.count,
            voterCount,
            boothCount,
            jobCounts,
            activeJob
        });
    } catch (e: any) {
        return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
    }
}
