import { NextResponse } from 'next/server';
import { processPageImageWithVisionAI } from '@/lib/vision-ai';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const imgDir = join(process.cwd(), 'public', 'uploads', 'assembly_pdfs', '375', '2026-EROLLGEN-S24-375-SIR-DraftRoll-Revision1-HIN-1-WI.pdf_ocr_pages');
        
        if (!existsSync(imgDir)) {
            return NextResponse.json({ error: `Image dir does not exist at ${imgDir}` });
        }

        const images = readdirSync(imgDir).filter(f => f.endsWith('.png'));
        if (images.length === 0) {
            return NextResponse.json({ error: `No PNG images in ${imgDir}` });
        }

        // Test scanning page 3 image
        const targetImg = images.find(f => f.includes('3')) || images[2] || images[0];
        const imgBuf = readFileSync(join(imgDir, targetImg));

        console.log(`[TEST VISION SCAN] Testing processPageImageWithVisionAI on ${targetImg}...`);
        const extractedVoters = await processPageImageWithVisionAI(imgBuf);

        return NextResponse.json({
            imgDir,
            targetImg,
            extractedCount: extractedVoters.length,
            sampleVoters: extractedVoters.slice(0, 5)
        });
    } catch (e: any) {
        return NextResponse.json({ error: String(e?.stack || e?.message || e) }, { status: 500 });
    }
}
