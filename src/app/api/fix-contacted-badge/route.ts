import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Set verificationStatus to UNVERIFIED for voters that don't have explicit feedback
        const result = await prisma.$executeRaw`
            UPDATE "Voter"
            SET "verificationStatus" = 'UNVERIFIED'
            WHERE "updatedByName" IS NULL AND ("notes" IS NULL OR "notes" = '') AND ("supportStatus" IS NULL OR "supportStatus" = 'Neutral')
        `;

        return NextResponse.json({
            success: true,
            message: `Successfully reset verificationStatus to UNVERIFIED for ${result} voters!`,
            updatedRows: result
        });
    } catch (e: any) {
        return NextResponse.json({ error: String(e?.stack || e?.message || e) }, { status: 500 });
    }
}
