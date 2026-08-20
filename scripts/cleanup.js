const { readdirSync, rmSync, existsSync } = require('fs');
const { join } = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING SRS 3.0 COMPLETE CLEANUP ---');

    // 1. Clean public/uploads/assembly_pdfs
    const assemblyPdfsDir = join(__dirname, '..', 'public', 'uploads', 'assembly_pdfs');
    if (existsSync(assemblyPdfsDir)) {
        const items = readdirSync(assemblyPdfsDir);
        for (const item of items) {
            const p = join(assemblyPdfsDir, item);
            try {
                rmSync(p, { recursive: true, force: true });
                console.log(`[DELETED] ${p}`);
            } catch (e) {
                console.error(`[ERROR DELETING] ${p}:`, e.message);
            }
        }
    }

    // 2. Clean public/uploads/pdf_queue
    const pdfQueueDir = join(__dirname, '..', 'public', 'uploads', 'pdf_queue');
    if (existsSync(pdfQueueDir)) {
        const items = readdirSync(pdfQueueDir);
        for (const item of items) {
            const p = join(pdfQueueDir, item);
            try {
                rmSync(p, { recursive: true, force: true });
                console.log(`[DELETED] ${p}`);
            } catch (e) {
                console.error(`[ERROR DELETING] ${p}:`, e.message);
            }
        }
    }

    // 3. Clear database tables for fresh start
    try {
        console.log('--- Cleaning database import jobs, voters, and booths ---');
        await prisma.importJob.deleteMany({});
        console.log('[DB CLEANED] importJob');

        await prisma.voterFeedback.deleteMany({});
        await prisma.voterEditRequest.deleteMany({});
        await prisma.voter.deleteMany({});
        console.log('[DB CLEANED] voter');

        await prisma.booth.deleteMany({});
        console.log('[DB CLEANED] booth');

        // Reset Assembly stats
        await prisma.assembly.updateMany({
            data: {
                totalVoters: 0,
                totalBooths: 0
            }
        });
        console.log('[DB UPDATED] assembly stats reset to 0');
    } catch (dbErr) {
        console.error('[DB CLEANUP ERR]:', dbErr);
    }

    console.log('--- CLEANUP COMPLETE SUCCESSFULLY ---');
    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
