import { prisma as prismaClient } from '@/lib/prisma';
import { extractTextFromPdf, parseUPVoterRoll, parseVotersAdvanced } from './pdf-parser';

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
        // BUT only if they haven't been updated for more than 5 minutes (to avoid resetting active slow work)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const stuckJobs = await (prisma as any).importJob.updateMany({
            where: {
                status: 'PROCESSING',
                updatedAt: { lt: fiveMinutesAgo }
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
            const startPage = job.startPage && job.startPage > 0 ? job.startPage : 1;
            const endPage = job.endPage && job.endPage > 0 ? job.endPage : 9999;
            console.log(`--- Page Range: ${startPage} to ${endPage} ---`);

            try {
                // Mark Processing
                await (prisma as any).importJob.update({
                    where: { id: job.id },
                    data: { status: 'PROCESSING', progress: 5 }
                });

                // USE ADVANCED PYTHON PARSER (Phase 3)
                const validVoters = await parseVotersAdvanced(
                    job.filePath,
                    async (pct) => {
                        await (prisma as any).importJob.update({
                            where: { id: job.id },
                            data: { progress: pct }
                        });
                    },
                    startPage,
                    endPage,
                    job.commonAddress || "",
                    job.boothName || ""
                );

                if (!validVoters || validVoters.length === 0) {
                    throw new Error('Advanced OCR found no voters. PDF might be empty or in unsupported format.');
                }

                // Update Job's boothName if missing but found in voters
                if (!job.boothName && validVoters[0]?.village) {
                    await (prisma as any).importJob.update({
                        where: { id: job.id },
                        data: { boothName: validVoters[0].village }
                    });
                    job.boothName = validVoters[0].village;
                }

                // Upsert Logic
                let created = 0, updated = 0;
                const affectedHouses = new Set<string>();

                for (const voter of validVoters) {
                    try {
                        const finalBoothNumber = job.boothNumber !== null ? job.boothNumber : (voter.boothNumber || 0);
                        // Construct combined address: House No + Village/Ward + Common Area
                        let addressParts = [];
                        if (voter.houseNumber) {
                            addressParts.push(`Makan Number- ${voter.houseNumber}`);
                        }

                        // Prioritize the village detected for this specific voter
                        // If the PDF parser found a village for this page/voter, use it.
                        // Otherwise fallback to the job-level boothName (if any).
                        const currentVillage = voter.village || job.boothName || '';
                        if (currentVillage) addressParts.push(currentVillage);

                        // job.commonAddress is the "rest of address"
                        if (job.commonAddress) addressParts.push(job.commonAddress);

                        const combinedAddress = addressParts.join(', ');

                        console.log(`--- Box Found: ${voter.name} | EPIC: ${voter.epic} ---`);
                        if (voter.originalText) {
                            console.log(`--- OCR Snippet: ${voter.originalText.substring(0, 80).replace(/\n/g, ' ')} ---`);
                        }

                        const data: any = {
                            name: voter.name || 'Unknown',
                            age: parseInt(String(voter.age || 0)) || 0,
                            gender: voter.gender || 'M',
                            relativeName: voter.relativeName || '',
                            relationType: voter.relationType || 'Father',
                            houseNumber: voter.houseNumber || '',
                            boothNumber: finalBoothNumber,
                            village: currentVillage || '',
                            area: combinedAddress || voter.area || '',
                            assemblyId: job.assemblyId
                        };

                        const houseKey = `${data.village}|${data.houseNumber}`;
                        if (data.houseNumber) affectedHouses.add(houseKey);

                        if (voter.epic === 'Unknown' || !voter.epic) {
                            console.log(`--- [SKIP] No EPIC detected for: ${voter.name} ---`);
                            continue;
                        }

                        const existing = await prisma.voter.findUnique({ where: { epic: voter.epic } });

                        if (existing) {
                            await prisma.voter.update({ where: { epic: voter.epic }, data: { ...data, importJobId: job.id } });
                            updated++;
                        } else {
                            await prisma.voter.create({ data: { ...data, epic: voter.epic, importJobId: job.id } });
                            created++;
                        }
                    } catch (e: any) {
                        console.error(`--- Voter Save Error (${voter.epic}): ${e.message} ---`);
                    }
                }

                // Sync Families
                for (const houseKey of affectedHouses) {
                    const [village, houseNumber] = houseKey.split('|');
                    const count = await prisma.voter.count({
                        where: {
                            village: village || '',
                            houseNumber: houseNumber || '',
                            assemblyId: job.assemblyId
                        }
                    });
                    await prisma.voter.updateMany({
                        where: {
                            village: village || '',
                            houseNumber: houseNumber || '',
                            assemblyId: job.assemblyId
                        },
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
