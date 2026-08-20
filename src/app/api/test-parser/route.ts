import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        // Use raw SQL to count voters (bypasses stale Prisma client entirely)
        const countResult = await prisma.$queryRaw`SELECT COUNT(*) as cnt FROM "Voter"` as any[];
        const totalAllVoters = Number(countResult[0]?.cnt ?? 0);

        const sampleRows = await prisma.$queryRaw`
            SELECT id, epic, name, "nameHi", age, gender, "houseNumber", village, caste, religion, "familyId", "boothNumber", "assemblyId"
            FROM "Voter"
            ORDER BY id DESC
            LIMIT 10
        ` as any[];

        const jobs = await prisma.$queryRaw`
            SELECT id, "fileName", "assemblyId", status, progress, "totalVoters", "errorMessage", logs
            FROM "ImportJob"
            ORDER BY id ASC
        ` as any[];

        // Test raw SQL insert/delete
        let rawInsertTest = null;
        let rawError = null;
        try {
            const testEpic = `TEST_${Date.now()}`;
            const nowStr = new Date().toISOString();
            await prisma.$executeRaw`
                INSERT INTO "Voter" (
                    epic, name, "relativeName", "relationType",
                    age, gender, "houseNumber", village, area,
                    "boothNumber", "assemblyId", caste, religion, "familyId",
                    "supportStatus", "isVoted", "isHead", "isPwD", "isImportant",
                    "dataQualityScore", "parsingLayer", "verificationStatus", "eciStatus",
                    status, "familySize", "createdAt", "updatedAt"
                ) VALUES (
                    ${testEpic}, 'Test Voter', 'Test Father', 'Father',
                    30, 'M', '1', 'TestVillage', 'TestArea',
                    1, 14, 'General', 'Hindu', 'FAM_14_1_1',
                    'Neutral', 0, 0, 0, 0,
                    85, 'VISION_AI', 'VERIFIED', 'IN_LIST',
                    'Active', 1, ${nowStr}, ${nowStr}
                )
            `;
            rawInsertTest = `RAW SQL SUCCESS: epic=${testEpic}`;
            await prisma.$executeRaw`DELETE FROM "Voter" WHERE epic = ${testEpic}`;
            rawInsertTest += ' → DELETED ok';
        } catch (e: any) {
            rawError = e?.message || String(e);
        }

        return NextResponse.json({
            ts: Date.now(),
            totalAllVoters,
            sampleVoters: sampleRows,
            rawInsertTest,
            rawError,
            jobsCount: jobs.length,
            jobs
        });
    } catch (e: any) {
        return NextResponse.json({ error: String(e?.stack || e?.message || e) }, { status: 500 });
    }
}
