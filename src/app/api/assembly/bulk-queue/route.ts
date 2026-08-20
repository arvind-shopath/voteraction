import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readdirSync, existsSync, mkdirSync, unlinkSync, statSync, renameSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { processImportQueue } from '@/lib/queue-processor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

function flattenPdfFiles(dir: string, targetDir: string) {
    const items = readdirSync(dir);
    for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
            flattenPdfFiles(fullPath, targetDir);
        } else if (item.toLowerCase().endsWith('.pdf')) {
            const destPath = join(targetDir, item);
            if (fullPath !== destPath && !existsSync(destPath)) {
                try {
                    renameSync(fullPath, destPath);
                } catch (e) {
                    console.error('Failed to move PDF:', e);
                }
            }
        }
    }
}

/**
 * POST /api/assembly/bulk-queue
 * 
 * Scans for PDFs and ZIP files, extracts ZIPs, queues PDFs for background worker.
 * Body: { assemblyId: number }
 */
export async function POST(req: Request) {
    try {
        const { assemblyId } = await req.json();

        if (!assemblyId) {
            return NextResponse.json({ error: 'assemblyId is required' }, { status: 400 });
        }

        const assembly = await (prisma as any).assembly.findUnique({
            where: { id: parseInt(String(assemblyId)) },
            select: { id: true, name: true, number: true }
        });

        if (!assembly) {
            return NextResponse.json({ error: 'Assembly not found' }, { status: 404 });
        }

        const baseDir = join(process.cwd(), 'public', 'uploads', 'assembly_pdfs');
        const primaryTargetDir = join(baseDir, `${assembly.number}`);
        if (!existsSync(primaryTargetDir)) {
            mkdirSync(primaryTargetDir, { recursive: true });
        }

        // STEP 1: Auto-Extract any ZIP files found for this assembly in baseDir or primaryTargetDir
        if (existsSync(baseDir)) {
            const allFiles = readdirSync(baseDir);
            const matchingZips = allFiles.filter(f => {
                if (!f.toLowerCase().endsWith('.zip')) return false;
                const m = f.match(/^(\d+)/);
                return m && parseInt(m[1]) === assembly.number;
            });

            for (const zf of matchingZips) {
                const fullZipPath = join(baseDir, zf);
                console.log(`[BULK-QUEUE] Auto-extracting ZIP: ${zf} into ${primaryTargetDir}`);
                const isWin = process.platform === 'win32';
                try {
                    if (isWin) {
                        execSync(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${fullZipPath}' -DestinationPath '${primaryTargetDir}' -Force"`, { maxBuffer: 1024 * 1024 * 500 });
                    } else {
                        execSync(`unzip -o "${fullZipPath}" -d "${primaryTargetDir}"`);
                    }
                } catch (e) {
                    try {
                        execSync(`tar -xf "${fullZipPath}" -C "${primaryTargetDir}"`);
                    } catch (tarErr) {
                        console.error('ZIP extract error:', e, tarErr);
                    }
                }

                // Delete ZIP file after extraction
                if (existsSync(fullZipPath)) {
                    unlinkSync(fullZipPath);
                    console.log(`[BULK-QUEUE] Deleted ZIP: ${fullZipPath}`);
                }

                // Flatten nested PDF subfolders
                flattenPdfFiles(primaryTargetDir, primaryTargetDir);
            }
        }

        // Possible directories to scan for PDFs
        const possibleDirs: string[] = [
            primaryTargetDir,
            join(baseDir, `${assembly.id}`),
            join(process.cwd(), 'public', 'uploads', 'pdf_queue'),
            join(process.cwd(), 'uploads', `assembly_${assembly.number}`)
        ];

        // Also auto-detect folders that start with the assembly number (e.g. "9- sikta", "168- malihabad")
        if (existsSync(baseDir)) {
            const allSubDirs = readdirSync(baseDir, { withFileTypes: true })
                .filter((d: any) => d.isDirectory())
                .map((d: any) => d.name);

            for (const dirName of allSubDirs) {
                const numMatch = dirName.match(/^(\d+)/);
                if (numMatch && parseInt(numMatch[1]) === assembly.number) {
                    const fullPath = join(baseDir, dirName);
                    if (!possibleDirs.includes(fullPath)) {
                        possibleDirs.unshift(fullPath);
                    }
                }
            }
        }

        // Get existing queued file paths for this assembly
        const existingJobs = await (prisma as any).importJob.findMany({
            where: { assemblyId: assembly.id },
            select: { filePath: true, status: true }
        });
        const queuedPaths = new Set(existingJobs.map((j: any) => j.filePath));

        let totalQueued = 0;
        let totalSkipped = 0;

        for (const dirPath of possibleDirs) {
            if (!existsSync(dirPath)) continue;

            const files = readdirSync(dirPath);
            const pdfFiles = files.filter((f: string) => f.toLowerCase().endsWith('.pdf'));

            for (const file of pdfFiles) {
                const fullPath = join(dirPath, file);

                if (queuedPaths.has(fullPath)) {
                    totalSkipped++;
                    continue;
                }

                let boothNumber: number | null = null;
                const boothMatch = file.match(/HIN-(\d+)-WI/i) || file.match(/(?:booth|part|b)[_\-\s]?(\d+)/i) || file.match(/^(\d+)/);
                if (boothMatch) {
                    boothNumber = parseInt(boothMatch[1]);
                }

                await (prisma as any).importJob.create({
                    data: {
                        fileName: file,
                        filePath: fullPath,
                        assemblyId: assembly.id,
                        boothNumber: boothNumber,
                        status: 'PENDING'
                    }
                });

                queuedPaths.add(fullPath);
                totalQueued++;
            }
        }

        // Trigger background processing worker
        if (totalQueued > 0 || queuedPaths.size > 0) {
            await (prisma as any).assembly.update({
                where: { id: assembly.id },
                data: { importStatus: 'PROCESSING' }
            }).catch(() => { });

            processImportQueue().catch(e => console.error("Worker error in bulk-queue:", e));
        }

        return NextResponse.json({
            success: true,
            message: totalQueued > 0
                ? `${totalQueued} नई PDF फ़ाइलें क्यू में जोड़ी गईं। बैकग्राउंड इंपोर्ट शुरू हो गया!`
                : `कुल ${queuedPaths.size} PDFs पहले से क्यू में हैं। बैकग्राउंड इंपोर्ट सक्रिय है।`,
            totalQueued,
            totalSkipped,
            totalJobs: queuedPaths.size
        });

    } catch (error: any) {
        console.error('[BULK-QUEUE ERROR]:', error);
        return NextResponse.json({ error: error.message || 'Bulk queue error' }, { status: 500 });
    }
}
