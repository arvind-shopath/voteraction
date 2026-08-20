import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { transliterateToEnglish } from '@/lib/transliteration';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const voters = await prisma.$queryRaw`
            SELECT id, name, "nameHi", "relativeName", "relativeNameHi"
            FROM "Voter"
        ` as any[];

        let cleanedCount = 0;
        for (const v of voters) {
            const nameHi = v.nameHi || v.name || '';
            const relHi = v.relativeNameHi || v.relativeName || '';

            const nameEnClean = transliterateToEnglish(nameHi);
            const relEnClean = transliterateToEnglish(relHi);

            await prisma.$executeRaw`
                UPDATE "Voter" SET
                    name = ${nameEnClean},
                    "nameEn" = ${nameEnClean},
                    "relativeName" = ${relEnClean},
                    "relativeNameEn" = ${relEnClean}
                WHERE id = ${v.id}
            `;
            cleanedCount++;
        }

        const updatedSample = await prisma.$queryRaw`
            SELECT id, epic, name, "nameHi", "relativeName", "relativeNameHi", age, gender, "houseNumber", village, caste, religion, "familyId", "boothNumber", "assemblyId"
            FROM "Voter"
            ORDER BY id DESC
            LIMIT 10
        ` as any[];

        return NextResponse.json({
            ts: Date.now(),
            cleanedCount,
            updatedSample
        });
    } catch (e: any) {
        return NextResponse.json({ error: String(e?.stack || e?.message || e) }, { status: 500 });
    }
}
