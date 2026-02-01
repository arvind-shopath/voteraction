import { prisma as prismaClient } from '@/lib/prisma';
import { extractTextFromPdf, parseUPVoterRoll } from './pdf-parser';

const prisma = prismaClient as any;
import { unlink } from 'fs/promises';

let isQueueProcessing = false;

export async function processImportQueue() {
    if (isQueueProcessing) {
        console.log('--- Queue Processor is already running. Standing by. ---');
        return;
    }

    try {
        isQueueProcessing = true;
        console.log('--- Background Queue Worker Started ---');

        // Initial Cleanup: Recover jobs stuck in PROCESSING from a previous crash
        // BUT only if they haven't been updated for more than 30 minutes (to avoid resetting active slow work)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const stuckJobs = await (prisma as any).importJob.updateMany({
            where: {
                status: 'PROCESSING',
                updatedAt: { lt: thirtyMinutesAgo }
            },
            data: { status: 'PENDING' }
        });

        if (stuckJobs.count > 0) {
            console.log(`--- Recovered ${stuckJobs.count} stuck jobs ---`);
        }

        while (true) {
            const job = await (prisma as any).importJob.findFirst({
                where: { status: 'PENDING' },
                orderBy: { addedAt: 'asc' }
            });

            if (!job) {
                console.log('--- No more pending jobs. Worker finishing. ---');
                break;
            }

            // Check if file still exists
            const { existsSync } = require('fs');
            if (!existsSync(job.filePath)) {
                console.log(`--- File missing for Job #${job.id}, marking as FAILED ---`);
                await (prisma as any).importJob.update({
                    where: { id: job.id },
                    data: { status: 'FAILED', errorMessage: 'PDF file not found on server' }
                });
                continue;
            }

            console.log(`--- Processing Job #${job.id}: ${job.fileName} ---`);
            try {
                // Mark Processing
                await (prisma as any).importJob.update({
                    where: { id: job.id },
                    data: { status: 'PROCESSING', progress: 5 }
                });

                const text = await extractTextFromPdf(job.filePath, async (pct) => {
                    // Update progress and updatedAt automatically
                    await (prisma as any).importJob.update({
                        where: { id: job.id },
                        data: { progress: pct }
                    });
                }, job.startPage || undefined, job.endPage || undefined);

                if (!text || text.length < 50) {
                    throw new Error('Failed to extract meaningful text from PDF');
                }

                // ... rest of the processing logic (voters, family size, etc.) ...
                // [Keeping the existing logic but ensuring it's robust]

                const voters = parseUPVoterRoll(text, job.commonAddress || undefined, job.boothName || undefined);
                const seenEpics = new Set<string>();
                const validVoters = voters.filter(v => {
                    if (!v.epic || v.epic.length < 9) return false;
                    if (seenEpics.has(v.epic)) return false;
                    seenEpics.add(v.epic);
                    return true;
                });

                // Upsert Logic
                let created = 0, updated = 0;
                const affectedHouses = new Set<string>();

                for (const voter of validVoters) {
                    try {
                        const finalBoothNumber = job.boothNumber !== null ? job.boothNumber : (voter.boothNumber || 0);
                        // Construct combined address: Village/Ward + Common Area
                        const combinedAddress = [job.boothName, job.commonAddress].filter(Boolean).join(', ');

                        const data = {
                            name: voter.name || 'Unknown',
                            age: voter.age || 0,
                            gender: voter.gender || 'M',
                            relativeName: voter.relativeName || '',
                            relationType: voter.relationType || 'Father',
                            houseNumber: voter.houseNumber || '',
                            boothNumber: finalBoothNumber,
                            village: voter.village || '',
                            area: combinedAddress || voter.area || '',
                            assemblyId: job.assemblyId
                        };

                        const houseKey = `${data.village}|${data.area}|${data.houseNumber}`;
                        if (data.houseNumber) affectedHouses.add(houseKey);

                        const existing = await prisma.voter.findUnique({ where: { epic: voter.epic } });

                        if (existing) {
                            await prisma.voter.update({ where: { epic: voter.epic }, data: { ...data, importJobId: job.id } });
                            updated++;
                        } else {
                            await prisma.voter.create({ data: { ...data, epic: voter.epic, importJobId: job.id } });
                            created++;
                        }
                    } catch (e) { }
                }

                // Sync Families
                for (const houseKey of affectedHouses) {
                    const [village, area, houseNumber] = houseKey.split('|');
                    const count = await prisma.voter.count({ where: { village, area, houseNumber, assemblyId: job.assemblyId } });
                    await prisma.voter.updateMany({
                        where: { village, area, houseNumber, assemblyId: job.assemblyId },
                        data: { familySize: count }
                    });
                }

                // Success
                await (prisma as any).importJob.update({
                    where: { id: job.id },
                    data: {
                        status: 'COMPLETED',
                        progress: 100,
                        totalVoters: validVoters.length,
                        completedAt: new Date(),
                        logs: `Success. Created: ${created}, Updated: ${updated}.`
                    }
                });
                await unlink(job.filePath).catch(() => { });

            } catch (err: any) {
                console.error(`--- Job #${job.id} Failed:`, err);
                await (prisma as any).importJob.update({
                    where: { id: job.id },
                    data: { status: 'FAILED', errorMessage: err.message || 'Error', completedAt: new Date() }
                });
                await unlink(job.filePath).catch(() => { });
            }
        }
    } catch (criticalErr) {
        console.error('CRITICAL WORKER ERROR:', criticalErr);
    } finally {
        isQueueProcessing = false;
        console.log('--- Worker finished and released lock. ---');
    }
}
