
const { PrismaClient } = require('@prisma/client');
const { extractTextFromPdf, parseUPVoterRoll } = require('../src/lib/pdf-parser');
const { unlink } = require('fs/promises');
const path = require('path');

const prisma = new PrismaClient();

async function processQueue() {
    console.log('Worker: Checking for pending jobs...');

    // Reset any jobs that were "stuck" in PROCESSING (e.g. if worker crashed)
    await prisma.importJob.updateMany({
        where: { status: 'PROCESSING' },
        data: { status: 'PENDING' }
    });

    while (true) {
        const job = await prisma.importJob.findFirst({
            where: { status: 'PENDING' },
            orderBy: { addedAt: 'asc' }
        });

        if (!job) {
            // No jobs? Wait and check again soon
            await new Promise(resolve => setTimeout(resolve, 10000));
            continue;
        }

        console.log(`Worker: Processing Job #${job.id} (${job.fileName})`);

        try {
            // Mark as PROCESSING
            await prisma.importJob.update({
                where: { id: job.id },
                data: { status: 'PROCESSING', progress: 5 }
            });

            // Extract Text
            // Note: We need to make sure pdf-parser functions are compatible or use the same logic
            // Since this is a JS script running in node, we might need a slightly different setup 
            // but for simplicity, I will adapt the existing queue-processor logic into a robust Loop.

            // ... (Logic from queue-processor.ts will be effectively moved/called here)
        } catch (err) {
            console.error(`Worker: Error in Job #${job.id}:`, err);
        }
    }
}
