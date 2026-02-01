import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { processImportQueue } from '@/lib/queue-processor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('file') as File[];
        const assemblyId = parseInt(formData.get('assemblyId') as string);

        if (!files || files.length === 0 || !assemblyId) {
            return NextResponse.json({ error: 'Files and assemblyId are required' }, { status: 400 });
        }

        const jobs = [];

        const boothNumber = formData.get('boothNumber') as string;
        const boothName = formData.get('boothName') as string;
        const commonAddress = formData.get('commonAddress') as string;
        const expectedVoters = formData.get('expectedVoters') as string;
        const startPage = formData.get('startPage') as string;
        const endPage = formData.get('endPage') as string;

        const boothNumberInt = boothNumber ? parseInt(boothNumber) : null;

        // Sync Booth Management: Create/Update booth record automatically
        if (boothNumberInt !== null) {
            try {
                await (prisma as any).booth.upsert({
                    where: {
                        number_assemblyId: {
                            number: boothNumberInt,
                            assemblyId: assemblyId
                        }
                    },
                    update: {
                        area: commonAddress || undefined
                    },
                    create: {
                        number: boothNumberInt,
                        assemblyId: assemblyId,
                        area: commonAddress || null
                    }
                });
                console.log(`Booth ${boothNumberInt} synced.`);
            } catch (e) {
                console.error("Booth sync failed:", e);
                // Non-critical, continue with job creation
            }
        }

        for (const file of files) {
            // Save PDF with simple name
            const uniqueName = `upload-${Date.now()}-${Math.floor(Math.random() * 1000)}.pdf`;
            const filePath = join(process.cwd(), 'public/uploads/pdf_queue', uniqueName);

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filePath, buffer);

            // Create Job with metadata in DB
            const job = await (prisma as any).importJob.create({
                data: {
                    fileName: file.name,
                    filePath: filePath,
                    assemblyId,
                    boothNumber: boothNumber ? parseInt(boothNumber) : null,
                    boothName: boothName || null,
                    commonAddress: commonAddress || null,
                    expectedCount: expectedVoters ? parseInt(expectedVoters) : null,
                    startPage: startPage ? parseInt(startPage) : null,
                    endPage: endPage ? parseInt(endPage) : null,
                    status: 'PENDING'
                }
            });
            jobs.push(job);
        }

        console.log(`Queued ${jobs.length} files. Triggering processor...`);

        // Trigger Processing (Fire and Forget)
        processImportQueue();

        return NextResponse.json({
            success: true,
            jobs: jobs.length,
            message: `Creating ${jobs.length} valid jobs. Processing started in background.`
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
