import { NextResponse } from 'next/server';
import { parseVotersAdvanced } from '@/lib/pdf-parser';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pdfPath = join(process.cwd(), 'public', 'uploads', 'assembly_pdfs', '375', '2026-EROLLGEN-S24-375-SIR-DraftRoll-Revision1-HIN-10-WI.pdf');
        
        let extractedPageVoters: any[] = [];
        const validVoters = await parseVotersAdvanced(
            pdfPath,
            (pct) => console.log(`[DEBUG PDF] progress ${pct}%`),
            1,
            9999,
            '',
            'Ghazipur',
            async (voters) => {
                console.log(`[DEBUG PDF Callback] Page voters: ${voters.length}`);
                extractedPageVoters.push(...voters);
            }
        );

        return NextResponse.json({
            pdfPath,
            callbackVotersCount: extractedPageVoters.length,
            validVotersCount: validVoters.length,
            sampleCallbackVoter: extractedPageVoters.slice(0, 3),
            sampleValidVoter: validVoters.slice(0, 3)
        });
    } catch (e: any) {
        return NextResponse.json({ error: String(e?.stack || e?.message || e) }, { status: 500 });
    }
}
