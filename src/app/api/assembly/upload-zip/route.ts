import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { existsSync, mkdirSync, unlinkSync, readdirSync, statSync, renameSync, createWriteStream } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { processImportQueue } from '@/lib/queue-processor';

const execAsync = promisify(exec);
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Helper to recursively find and move all .pdf files from nested subdirectories to targetDir
 */
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
 * POST /api/assembly/upload-zip
 * 
 * Supports both:
 * 1. Direct binary streaming (via query params: ?assemblyId=X&fileName=Y)
 * 2. Multipart FormData (file, assemblyId)
 */
export async function POST(req: Request) {
    let tempZipPath = '';
    try {
        const { searchParams } = new URL(req.url);
        let assemblyId = searchParams.get('assemblyId');
        let fileName = searchParams.get('fileName') || 'upload.zip';

        const contentType = req.headers.get('content-type') || '';
        let assembly: any = null;

        // If streamed directly via octet-stream
        if (assemblyId && (contentType.includes('application/octet-stream') || req.body)) {
            assembly = await (prisma as any).assembly.findUnique({
                where: { id: parseInt(String(assemblyId)) },
                select: { id: true, name: true, number: true }
            });

            if (!assembly) {
                return NextResponse.json({ error: 'Assembly not found' }, { status: 404 });
            }

            const targetDir = join(process.cwd(), 'public', 'uploads', 'assembly_pdfs', String(assembly.number));
            if (!existsSync(targetDir)) {
                mkdirSync(targetDir, { recursive: true });
            }

            tempZipPath = join(targetDir, `upload_${Date.now()}.zip`);

            if (req.body) {
                const nodeStream = Readable.fromWeb(req.body as any);
                const fileStream = createWriteStream(tempZipPath);
                await pipeline(nodeStream, fileStream);
            } else {
                return NextResponse.json({ error: 'No data streamed' }, { status: 400 });
            }

            console.log(`[ZIP UPLOAD] Streamed ZIP file to ${tempZipPath}`);
        } else {
            // FormData Fallback
            const formData = await req.formData();
            const file = formData.get('file') as File;
            assemblyId = formData.get('assemblyId') as string;

            if (!file || !assemblyId) {
                return NextResponse.json({ error: 'file and assemblyId are required' }, { status: 400 });
            }

            assembly = await (prisma as any).assembly.findUnique({
                where: { id: parseInt(String(assemblyId)) },
                select: { id: true, name: true, number: true }
            });

            if (!assembly) {
                return NextResponse.json({ error: 'Assembly not found' }, { status: 404 });
            }

            const targetDir = join(process.cwd(), 'public', 'uploads', 'assembly_pdfs', String(assembly.number));
            if (!existsSync(targetDir)) {
                mkdirSync(targetDir, { recursive: true });
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            tempZipPath = join(targetDir, `upload_${Date.now()}.zip`);
            require('fs').writeFileSync(tempZipPath, buffer);
            console.log(`[ZIP UPLOAD] Saved ZIP (${(buffer.length / 1024 / 1024).toFixed(2)} MB) to ${tempZipPath}`);
        }

        const targetDir = join(process.cwd(), 'public', 'uploads', 'assembly_pdfs', String(assembly.number));

        // Extract ZIP file cross-platform
        const isWin = process.platform === 'win32';
        try {
            if (isWin) {
                // Windows PowerShell Expand-Archive
                const cmd = `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${tempZipPath}' -DestinationPath '${targetDir}' -Force"`;
                console.log('[ZIP EXTRACT] Running:', cmd);
                await execAsync(cmd, { maxBuffer: 1024 * 1024 * 50 });
            } else {
                // Linux / VPS: unzip
                const cmd = `unzip -o "${tempZipPath}" -d "${targetDir}"`;
                console.log('[ZIP EXTRACT] Running:', cmd);
                await execAsync(cmd, { maxBuffer: 1024 * 1024 * 50 });
            }
        } catch (extractErr: any) {
            // Fallback: try tar command on modern Windows or Linux
            try {
                console.log('[ZIP EXTRACT] Fallback tar command...');
                await execAsync(`tar -xf "${tempZipPath}" -C "${targetDir}"`);
            } catch (tarErr: any) {
                console.error('[ZIP EXTRACT ERROR]:', extractErr, tarErr);
                throw new Error('ZIP एक्सट्रैक्ट नहीं हो सकी। कृपया ZIP फ़ाइल जांचें।');
            }
        }

        // Delete the ZIP file after extraction
        if (existsSync(tempZipPath)) {
            unlinkSync(tempZipPath);
            console.log(`[ZIP UPLOAD] Deleted ZIP file: ${tempZipPath}`);
        }

        // Flatten any nested subfolders inside targetDir so all .pdf files are directly in targetDir
        flattenPdfFiles(targetDir, targetDir);

        // Find all extracted PDF files
        const files = readdirSync(targetDir);
        const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            return NextResponse.json({
                error: 'ZIP फ़ाइल में कोई PDF फ़ाइलें नहीं मिलीं।'
            }, { status: 400 });
        }

        // Get existing import jobs for this assembly
        const existingJobs = await (prisma as any).importJob.findMany({
            where: { assemblyId: assembly.id },
            select: { filePath: true }
        });
        const queuedPaths = new Set(existingJobs.map((j: any) => j.filePath));

        let queuedCount = 0;
        let skippedCount = 0;

        for (const file of pdfFiles) {
            const fullPath = join(targetDir, file);

            if (queuedPaths.has(fullPath)) {
                skippedCount++;
                continue;
            }

            // Extract booth number from filename
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

            queuedCount++;
        }

        // Update assembly status
        await (prisma as any).assembly.update({
            where: { id: assembly.id },
            data: { importStatus: 'PROCESSING' }
        }).catch(() => { });

        // Trigger background processing worker
        if (queuedCount > 0) {
            processImportQueue().catch(e => console.error("Worker error after ZIP upload:", e));
        }

        return NextResponse.json({
            success: true,
            message: `ZIP सफलतापूर्वक एक्सट्रैक्ट हुई! ${pdfFiles.length} PDFs मिलीं (${queuedCount} नई क्यू में लगीं)। बैकग्राउंड इंपोर्ट शुरू हो गया!`,
            totalPdfs: pdfFiles.length,
            queuedCount,
            skippedCount
        });

    } catch (error: any) {
        console.error('[ZIP UPLOAD ROUTE ERROR]:', error);
        // Ensure temp ZIP is cleaned up on error
        if (tempZipPath && existsSync(tempZipPath)) {
            try { unlinkSync(tempZipPath); } catch (e) { }
        }
        return NextResponse.json({ error: error.message || 'ZIP अपलोड विफल' }, { status: 500 });
    }
}
