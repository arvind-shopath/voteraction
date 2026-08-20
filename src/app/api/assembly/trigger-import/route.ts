import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processImportQueue } from '@/lib/queue-processor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/assembly/trigger-import
 * Directly triggers queue processing for pending jobs.
 * Body: { assemblyId?: number }  (optional - if not given, processes ALL pending)
 */
export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { assemblyId } = body;

        const where: any = { status: 'PENDING' };
        if (assemblyId) where.assemblyId = parseInt(String(assemblyId));

        const pendingCount = await (prisma as any).importJob.count({ where });

        if (pendingCount === 0) {
            return NextResponse.json({
                success: true,
                message: 'No pending jobs found.',
                pendingCount: 0
            });
        }

        // Fire and forget
        processImportQueue().catch((e: any) => {
            console.error('Queue processing error:', e);
        });

        return NextResponse.json({
            success: true,
            message: `Processing started for ${pendingCount} pending jobs.`,
            pendingCount
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * GET /api/assembly/trigger-import?assemblyId=X
 * Returns current job status summary for an assembly
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const assemblyId = searchParams.get('assemblyId');

        const where: any = {};
        if (assemblyId) where.assemblyId = parseInt(assemblyId);

        const jobs = await (prisma as any).importJob.groupBy({
            by: ['status'],
            where,
            _count: { id: true }
        });

        const summary: any = { PENDING: 0, PROCESSING: 0, COMPLETED: 0, FAILED: 0, VERIFICATION_REQUIRED: 0 };
        for (const j of jobs) {
            summary[j.status] = j._count.id;
        }

        const totalVoters = assemblyId
            ? await (prisma as any).voter.count({ where: { assemblyId: parseInt(assemblyId) } })
            : await (prisma as any).voter.count();

        return NextResponse.json({ success: true, summary, totalVoters });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
