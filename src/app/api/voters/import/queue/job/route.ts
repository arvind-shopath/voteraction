import { NextResponse, NextRequest } from 'next/server';
import { prisma as prismaClient } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { revalidatePath } from 'next/cache';

const prisma = prismaClient as any;

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const idStr = searchParams.get('id');
        if (!idStr) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const jobId = parseInt(idStr);

        // 1. Get Job details
        const job = await prisma.importJob.findUnique({
            where: { id: jobId }
        });

        if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

        // 2. If job is PROCESSING, we shouldn't delete it easily (could lead to DB corruption if mid-transaction)
        if (job.status === 'PROCESSING') {
            return NextResponse.json({ error: 'Cannot delete a job while it is processing' }, { status: 400 });
        }

        // 3. Delete all Voters associated with this job
        // This is a CRITICAL step requested by user: "उस क्यू के पूरे डेटा को डिलीट कर सकूं"
        const deletedVoters = await prisma.voter.deleteMany({
            where: { importJobId: jobId }
        });

        console.log(`Deleted ${deletedVoters.count} voters associated with Job #${jobId}`);

        // 4. Delete the file
        await unlink(job.filePath).catch((e: any) => console.log('File not found or already deleted:', e.message));

        // 5. Delete the job record itself
        await prisma.importJob.delete({ where: { id: jobId } });

        return NextResponse.json({
            success: true,
            message: `Job #${jobId} and ${deletedVoters.count} voters deleted successfully.`
        });

    } catch (e: any) {
        console.error('Delete Job Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const idStr = searchParams.get('id');
        if (!idStr) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const jobId = parseInt(idStr);
        const body = await request.json();

        const { boothNumber, boothName, commonAddress } = body;

        // 1. Update the Job record
        const updatedJob = await prisma.importJob.update({
            where: { id: jobId },
            data: {
                boothNumber: boothNumber ? parseInt(boothNumber) : null,
                boothName: boothName || null,
                commonAddress: commonAddress || null
            }
        });

        // 2. If job was already COMPLETED, update all voters associated with it
        // This handles: "हर मतदाता का डेटा न अपेडट करना पड़े सिर्फ क्यू से अपडेट करके... डेटा अपडेट हो जाए"
        if (updatedJob.status === 'COMPLETED') {
            const combinedAddress = [updatedJob.boothName, updatedJob.commonAddress].filter(Boolean).join(', ');

            await prisma.voter.updateMany({
                where: { importJobId: jobId },
                data: {
                    boothNumber: updatedJob.boothNumber,
                    village: updatedJob.boothName || '', // Village/Ward
                    area: combinedAddress || ''
                }
            });
            console.log(`Updated voters for Job #${jobId} to new location: ${updatedJob.boothName}`);
        }

        return NextResponse.json({ success: true, job: updatedJob });

    } catch (e: any) {
        console.error('Update Job Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
