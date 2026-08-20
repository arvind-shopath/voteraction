import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { autoQueuePdfFilesForAssembly, processImportQueue } from '@/lib/queue-processor';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const assemblyCols = [
            "ALTER TABLE Assembly ADD COLUMN nameHindi TEXT",
            "ALTER TABLE Assembly ADD COLUMN nameEnglish TEXT"
        ];

        for (const sql of assemblyCols) {
            try {
                await (prisma as any).$executeRawUnsafe(sql);
            } catch (e) {}
        }

        const voterCols = [
            "ALTER TABLE Voter ADD COLUMN casteCategory TEXT",
            "ALTER TABLE Voter ADD COLUMN religion TEXT",
            "ALTER TABLE Voter ADD COLUMN familyId TEXT"
        ];

        for (const sql of voterCols) {
            try {
                await (prisma as any).$executeRawUnsafe(sql);
            } catch (e) {}
        }

        // Cleanup ghost/orphaned campaigns (e.g., Rajesh Kumar)
        const campaigns = await (prisma as any).campaign.findMany({ include: { users: true } });
        for (const c of campaigns) {
            const isRajesh = (c.name && c.name.includes('राजेश')) || (c.candidateName && c.candidateName.includes('राजेश')) || (c.name && c.name.toLowerCase().includes('rajesh'));
            const candidateUsers = c.users ? c.users.filter((u: any) => u.role === 'CANDIDATE') : [];

            if (isRajesh || candidateUsers.length === 0) {
                await (prisma as any).workerSocialTask.deleteMany({ where: { campaignId: c.id } }).catch(() => {});
                await (prisma as any).campaignMaterial.deleteMany({ where: { campaignId: c.id } }).catch(() => {});
                await (prisma as any).user.updateMany({ where: { campaignId: c.id }, data: { campaignId: null } }).catch(() => {});
                await (prisma as any).campaign.delete({ where: { id: c.id } }).catch(() => {});
            }
        }

        const assemblies = await (prisma as any).assembly.findMany({ select: { id: true } });
        for (const ass of assemblies) {
            await autoQueuePdfFilesForAssembly(ass.id);
        }

        processImportQueue().catch(() => {});

        return NextResponse.json({ success: true, message: "Database updated, ghost data cleaned, and PDFs queued." });
    } catch (error: any) {
        return NextResponse.json({ error: String(error?.message || error), stack: String(error?.stack || '') }, { status: 500 });
    }
}
