import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    const results: any = { ts: Date.now(), deletedFiles: 0, dbCleared: false };

    try {
        // 1. Delete all files in public/uploads/assembly_pdfs
        const assemblyPdfsDir = join(process.cwd(), 'public', 'uploads', 'assembly_pdfs');
        if (existsSync(assemblyPdfsDir)) {
            const items = readdirSync(assemblyPdfsDir);
            for (const item of items) {
                const p = join(assemblyPdfsDir, item);
                try {
                    rmSync(p, { recursive: true, force: true });
                    results.deletedFiles++;
                } catch (e) {}
            }
        }

        // 2. Delete all files in public/uploads/pdf_queue
        const pdfQueueDir = join(process.cwd(), 'public', 'uploads', 'pdf_queue');
        if (existsSync(pdfQueueDir)) {
            const items = readdirSync(pdfQueueDir);
            for (const item of items) {
                const p = join(pdfQueueDir, item);
                try {
                    rmSync(p, { recursive: true, force: true });
                    results.deletedFiles++;
                } catch (e) {}
            }
        }

        // 3. Clear database tables
        await (prisma as any).importJob.deleteMany({});
        await (prisma as any).voterFeedback.deleteMany({}).catch(() => {});
        await (prisma as any).voterEditRequest.deleteMany({}).catch(() => {});
        await (prisma as any).voter.deleteMany({});
        await (prisma as any).booth.deleteMany({});

        await (prisma as any).assembly.updateMany({
            data: {
                totalVoters: 0,
                totalBooths: 0
            }
        });

        results.dbCleared = true;
        return NextResponse.json(results);
    } catch (e: any) {
        return NextResponse.json({ error: String(e?.stack || e?.message || e) }, { status: 500 });
    }
}
