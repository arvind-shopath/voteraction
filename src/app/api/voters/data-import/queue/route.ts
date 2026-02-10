import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processImportQueue } from '@/lib/queue-processor';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // Trigger background processing
        processImportQueue();
        return NextResponse.json({ success: true, message: 'Processing triggered' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        // Auto-resume if anything is PENDING or was left PROCESSING from a crash
        const pendingOrStuck = await (prisma as any).importJob.findFirst({
            where: { status: { in: ['PENDING', 'PROCESSING'] } }
        });

        if (pendingOrStuck) {
            processImportQueue();
        }

        const jobs = await (prisma as any).importJob.findMany({
            orderBy: { id: 'desc' },
            take: 50,
            include: { assembly: { select: { number: true, name: true } } }
        });

        // Enhance with distinct villages and counts for COMPLETED jobs
        const enhancedJobs = await Promise.all(jobs.map(async (job: any) => {
            if (job.status === 'COMPLETED') {
                const grouped = await (prisma as any).voter.groupBy({
                    by: ['village'],
                    where: { importJobId: job.id },
                    _count: { _all: true }
                });

                const villages = grouped
                    .filter((g: any) => g.village && g.village !== 'Unknown')
                    .map((g: any) => ({
                        name: g.village,
                        count: g._count._all
                    }));

                return { ...job, detectedVillages: villages };
            }
            return { ...job, detectedVillages: [] };
        }));

        return NextResponse.json({ jobs: enhancedJobs });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const jobId = parseInt(id);
        const job = await (prisma as any).importJob.findUnique({ where: { id: jobId } });

        if (job) {
            await (prisma as any).importJob.delete({ where: { id: jobId } });

            // If strictly pending, delete file to save space/prevent potential loose processing
            if (job.status === 'PENDING' || job.status === 'FAILED') {
                const { unlink } = require('fs/promises');
                await unlink(job.filePath).catch(() => { });
            }
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
