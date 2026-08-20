import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const topFamiliesRaw = await prisma.$queryRaw`
            SELECT "familyId", "houseNumber", "boothNumber", COUNT(*) as member_count
            FROM "Voter"
            WHERE "familyId" IS NOT NULL AND "familyId" != ''
            GROUP BY "familyId"
            ORDER BY member_count DESC
            LIMIT 15
        ` as any[];

        const topFamilies = topFamiliesRaw.map(f => ({
            ...f,
            member_count: Number(f.member_count)
        }));

        const sampleVotersFromTopFamily = topFamilies.length > 0 ? await prisma.$queryRaw`
            SELECT id, epic, name, "nameHi", "relativeName", "houseNumber", "boothNumber", "familyId"
            FROM "Voter"
            WHERE "familyId" = ${topFamilies[0].familyId}
            LIMIT 10
        ` : [];

        return NextResponse.json({
            topFamiliesCount: topFamilies.length,
            topFamilies,
            sampleVotersFromTopFamily
        });
    } catch (e: any) {
        return NextResponse.json({ error: String(e?.stack || e?.message || e) }, { status: 500 });
    }
}
