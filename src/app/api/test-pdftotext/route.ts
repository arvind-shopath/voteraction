import { NextResponse } from 'next/server';
import { extractTextFromPdf } from '@/lib/pdf-parser';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pdfPath = join(process.cwd(), 'public', 'uploads', 'assembly_pdfs', '375', '2026-EROLLGEN-S24-375-SIR-DraftRoll-Revision1-HIN-1-WI.pdf');
        
        const rawText = await extractTextFromPdf(pdfPath, async () => {}, 1, 5);

        return NextResponse.json({
            pdfPath,
            rawTextLength: rawText.length,
            sampleSnippet: rawText.substring(0, 1500)
        });
    } catch (e: any) {
        return NextResponse.json({ error: String(e?.stack || e?.message || e) }, { status: 500 });
    }
}
