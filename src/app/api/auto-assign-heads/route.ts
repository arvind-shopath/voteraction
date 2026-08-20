import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('[AUTO-ASSIGN HEADS] Starting auto-assignment of family heads...');

        // 1. Reset isHead to 0 for voters in families
        await prisma.$executeRaw`
            UPDATE "Voter" 
            SET "isHead" = 0 
            WHERE "familyId" IS NOT NULL AND "familyId" != ''
        `;

        // 2. Assign isHead = 1 to oldest voter in each familyId
        await prisma.$executeRaw`
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
        `;

        // 3. Count total heads assigned
        const headCountRes = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM "Voter" WHERE "isHead" = 1
        ` as any[];
        
        const count = Number(headCountRes?.[0]?.count || 0);

        return NextResponse.json({
            success: true,
            message: `Successfully auto-assigned family heads (Mukhiya) to oldest member in each family!`,
            headsCount: count
        });
    } catch (e: any) {
        return NextResponse.json({ error: String(e?.stack || e?.message || e) }, { status: 500 });
    }
}
