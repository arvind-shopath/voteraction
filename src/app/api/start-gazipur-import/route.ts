import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { processImportQueue } from '@/lib/queue-processor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    const results: any = { ts: Date.now(), steps: [] };

    try {
        // 1. Clean previous dummy records for Ghazipur (assemblyId 14, number 375)
        await (prisma as any).importJob.deleteMany({ where: { assemblyId: 14 } });
        await (prisma as any).voter.deleteMany({ where: { assemblyId: 14 } });
        await (prisma as any).booth.deleteMany({ where: { assemblyId: 14 } });
        await (prisma as any).assembly.update({
            where: { id: 14 },
            data: { totalVoters: 0, totalBooths: 0 }
        });
        results.steps.push('Cleaned old dummy records for Ghazipur Assembly (id 14, number 375)');

        // 2. Source directory on disk
        const sourceDir = 'C:\\Users\\creatiAV\\Documents\\voteraction\\gazipur';
        const targetDir = join(process.cwd(), 'public', 'uploads', 'assembly_pdfs', '375');
        if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

        const pdfFiles = readdirSync(sourceDir).filter(f => f.endsWith('.pdf'));
        results.sourcePdfCount = pdfFiles.length;

        // 3. Copy files & create ImportJob entries
        let queued = 0;
        for (const pdfFile of pdfFiles) {
            const srcPath = join(sourceDir, pdfFile);
            const destPath = join(targetDir, pdfFile);
            copyFileSync(srcPath, destPath);

            const m = pdfFile.match(/HIN-(\d+)-WI/i) || pdfFile.match(/(\d+)/);
            const boothNumber = m ? parseInt(m[1]) : null;

            await (prisma as any).importJob.create({
                data: {
                    fileName: pdfFile,
                    filePath: destPath,
                    assemblyId: 14,
                    boothNumber: boothNumber,
                    status: 'PENDING'
                }
            });
            queued++;
        }
        results.queuedJobs = queued;
        results.steps.push(`Copied ${queued} PDFs to ${targetDir} and created ImportJob entries.`);

        // 4. Trigger processImportQueue asynchronously
        processImportQueue().catch(e => console.error('Ghazipur Worker error:', e));
        results.steps.push('Background queue processing started successfully!');

    } catch (e: any) {
        results.error = String(e?.stack || e?.message || e);
    }

    return NextResponse.json(results);
}
