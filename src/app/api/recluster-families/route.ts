import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('[VILLAGE-BASED RECLUSTER] Grouping voters by Village, House Number, and Relative Name...');

        // 0. Ensure Index on familyId for blazing fast queries
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_voter_familyId" ON "Voter"("familyId")`);

        // 1. Instant Raw SQL Update for familyId using Village Name, House No & Cleaned Relative Name
        await prisma.$executeRawUnsafe(`
            UPDATE "Voter"
            SET "familyId" = 'FAM_' || "assemblyId" || '_' || LOWER(REPLACE(REPLACE(COALESCE("village", "villageHi", "villageEn", "area", 'v'), ' ', ''), '.', '')) || '_' || COALESCE("houseNumber", '0') || '_' || LOWER(REPLACE(REPLACE(COALESCE("relativeNameEn", "relativeName", "relativeNameHi", 'x'), ' ', ''), '.', ''))
        `);

        // 2. Instant Raw SQL Update for familySize using subquery
        await prisma.$executeRawUnsafe(`
            UPDATE "Voter"
            SET "familySize" = (
                SELECT COUNT(*) FROM "Voter" v2 WHERE v2."familyId" = "Voter"."familyId"
            )
        `);

        // 3. Instant Raw SQL Update for isHead (Oldest member in each familyId)
        await prisma.$executeRawUnsafe(`UPDATE "Voter" SET "isHead" = 0 WHERE "familyId" IS NOT NULL AND "familyId" != ''`);

        await prisma.$executeRawUnsafe(`
            UPDATE "Voter"
            SET "isHead" = 1
            WHERE id IN (
                SELECT MIN(v.id)
                FROM "Voter" v
                INNER JOIN (
                    SELECT "familyId", MAX(age) as max_age
                    FROM "Voter"
                    WHERE "familyId" IS NOT NULL AND "familyId" != ''
                    GROUP BY "familyId"
                ) fmax ON v."familyId" = fmax."familyId" AND v.age = fmax.max_age
                GROUP BY v."familyId"
            )
        `);

        // Check top family sizes after village-based SQL recluster
        const topFamiliesRaw = await prisma.$queryRaw`
            SELECT "familyId", "village", "houseNumber", COUNT(*) as member_count
            FROM "Voter"
            WHERE "familyId" IS NOT NULL AND "familyId" != ''
            GROUP BY "familyId"
            ORDER BY member_count DESC
            LIMIT 10
        ` as any[];

        const topFamilies = topFamiliesRaw.map(f => ({
            ...f,
            member_count: Number(f.member_count)
        }));

        return NextResponse.json({
            success: true,
            message: `Village-based family clustering completed! Realistic family sizes established by Village + House No + Relative Name.`,
            topFamilies
        });
    } catch (e: any) {
        console.error('[RECLUSTER ERROR]:', e);
        return NextResponse.json({ error: String(e?.stack || e?.message || e) }, { status: 500 });
    }
}
