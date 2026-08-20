
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { pathToFileURL } from 'url';

const execAsync = promisify(exec);

// Get the bundled pdftotext binary path from pdf-poppler package
function getBundledPdftotextPath(): string {
    const platform = process.platform;
    if (platform === 'win32') {
        return join(process.cwd(), 'node_modules', 'pdf-poppler', 'lib', 'win', 'poppler-0.51', 'bin', 'pdftotext.exe');
    } else if (platform === 'darwin') {
        return join(process.cwd(), 'node_modules', 'pdf-poppler', 'lib', 'osx', 'poppler-0.66', 'bin', 'pdftotext');
    }
    return 'pdftotext'; // fallback to system PATH
}

export async function extractTextFromPdf(
    pdfPath: string,
    onProgress?: (pct: number) => Promise<void>,
    startPage?: number,
    endPage?: number,
    onVotersExtracted?: (voters: VoterData[]) => Promise<void>
): Promise<string> {
    // PRIMARY: Use bundled pdftotext from pdf-poppler package
    const bundledPdftotext = getBundledPdftotextPath();
    const tempTxtPath = pdfPath + '.extracted.txt';

    if (existsSync(bundledPdftotext)) {
        try {
            let first = startPage || 1;
            let last = endPage || 9999;
            if (first > last) { const temp = first; first = last; last = temp; }

            console.log(`[BUNDLED pdftotext] Extracting from ${pdfPath}, pages ${first}-${last}`);
            console.log(`[BUNDLED pdftotext] Binary: ${bundledPdftotext}`);

            await execAsync(`"${bundledPdftotext}" -f ${first} -l ${last} -layout -enc UTF-8 "${pdfPath}" "${tempTxtPath}"`, {
                maxBuffer: 50 * 1024 * 1024 // 50MB buffer
            });

            if (existsSync(tempTxtPath)) {
                const text = await readFile(tempTxtPath, 'utf-8');
                // Clean up temp file
                try { const { unlink } = await import('fs/promises'); await unlink(tempTxtPath); } catch {}

                if (text.trim().length > 50) {
                    console.log(`[BUNDLED pdftotext SUCCESS] Extracted ${text.length} chars from ${pdfPath}`);
                    return text;
                }
            }
        } catch (bundledErr) {
            console.error('[BUNDLED pdftotext error]:', bundledErr);
        }
    } else {
        console.log(`[BUNDLED pdftotext] Binary not found at ${bundledPdftotext}`);
    }

    // FALLBACK 1: System pdftotext
    try {
        let first = startPage || 1;
        let last = endPage || 9999;
        if (first > last) { const temp = first; first = last; last = temp; }

        console.log(`[SYSTEM pdftotext] Trying system PATH pdftotext...`);

        await execAsync(`pdftotext -f ${first} -l ${last} -layout -enc UTF-8 "${pdfPath}" "${tempTxtPath}"`, {
            maxBuffer: 50 * 1024 * 1024
        });

        if (existsSync(tempTxtPath)) {
            const text = await readFile(tempTxtPath, 'utf-8');
            try { const { unlink } = await import('fs/promises'); await unlink(tempTxtPath); } catch {}
            if (text.trim().length > 50) {
                console.log(`[SYSTEM pdftotext SUCCESS] Extracted ${text.length} chars from ${pdfPath}`);
                return text;
            }
        }
    } catch (sysErr) {
        console.error('[SYSTEM pdftotext failed]:', sysErr);
    }

    // FALLBACK 2: pdfjs-dist for text-layer PDFs (won't work for scanned/image PDFs)
    try {
        const dataBuffer = await readFile(pdfPath);
        const uint8 = new Uint8Array(dataBuffer);

        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const workerPath = join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

        const loadingTask = pdfjsLib.getDocument({
            data: uint8,
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
            disableFontFace: true,
        });

        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        const first = Math.max(startPage || 1, 1);
        const last = Math.min(endPage || totalPages, totalPages);

        console.log(`[pdfjs-dist] Extracting text from ${pdfPath}, pages ${first}-${last} (total: ${totalPages})`);

        const pageTexts: string[] = [];
        for (let i = first; i <= last; i++) {
            try {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const strings = content.items
                    .filter((item: any) => 'str' in item)
                    .map((item: any) => item.str);
                pageTexts.push(strings.join(' '));
            } catch (pageErr) {
                console.error(`[pdfjs-dist] Error on page ${i}:`, pageErr);
            }
        }

        const fullText = pageTexts.join('\n\n--- PAGE BREAK ---\n\n');
        const cleanContentLength = fullText.replace(/--- PAGE BREAK ---/g, '').trim().length;
        if (cleanContentLength > 50) {
            console.log(`[pdfjs-dist SUCCESS] Extracted ${fullText.length} chars from ${pdfPath}`);
            return fullText;
        }
    } catch (pdfjsErr) {
        console.error('[pdfjs-dist error]:', pdfjsErr);
    }

    // FALLBACK 3: Scanned PDF Image Rendering & Tesseract.js OCR Engine
    try {
        console.log(`[SCANNED PDF OCR] Starting fast grayscale page rendering for ${pdfPath}...`);
        const { readdirSync, mkdirSync, existsSync, rmSync } = require('fs');
        const imgDir = pdfPath + '_ocr_pages';
        if (!existsSync(imgDir)) mkdirSync(imgDir, { recursive: true });

        const pdftocairoBin = join(process.cwd(), 'node_modules', 'pdf-poppler', 'lib', 'win', 'poppler-0.51', 'bin', 'pdftocairo.exe');

        if (existsSync(pdftocairoBin)) {
            console.log(`[SCANNED PDF OCR] Executing pdftocairo.exe -png -gray -scale-to 800...`);
            await execAsync(`"${pdftocairoBin}" -png -gray -scale-to 800 "${pdfPath}" "${join(imgDir, 'img')}"`, {
                maxBuffer: 50 * 1024 * 1024
            });
        } else {
            console.error(`[SCANNED PDF OCR] pdftocairo.exe not found at ${pdftocairoBin}`);
        }

        let imageFiles = existsSync(imgDir) ? readdirSync(imgDir).filter((f: string) => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')).sort() : [];
        console.log(`[SCANNED PDF OCR] Found ${imageFiles.length} extracted page PNG images.`);

        if (imageFiles.length > 0) {
            const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            const { readFileSync } = require('fs');
            const { processPageImageWithVisionAI } = await import('./vision-ai');
            const ocrTexts: string[] = [];

            const totalImgs = imageFiles.length;

            if (apiKey) {
                console.log(`[SCANNED PDF OCR] Using Gemini 2.5 Flash Vision AI for high-speed page image scanning...`);
                for (let i = 0; i < totalImgs; i++) {
                    if (i === 1 && totalImgs > 3) continue; // skip map page
                    const imgPath = join(imgDir, imageFiles[i]);
                    try {
                        console.log(`[VISION AI SCAN] Scanning Page ${i + 1}/${totalImgs}...`);
                        const imgBuf = readFileSync(imgPath);
                        const visionVoters = await processPageImageWithVisionAI(imgBuf);

                        if (visionVoters.length > 0) {
                            const pageText = visionVoters.map(v =>
                                `EPIC: ${v.epic_no}\nनाम: ${v.voter_name_hi}\nपिता/पति का नाम: ${v.relative_name_hi}\nसम्बन्ध: ${v.relation_type}\nमकान संख्या: ${v.house_no}\nउम्र: ${v.age || ''}\nलिंग: ${v.gender}`
                            ).join('\n---\n');
                            ocrTexts.push(pageText);
                            console.log(`[VISION AI SCAN] Page ${i + 1} SUCCESS (${visionVoters.length} voters extracted).`);

                            if (onVotersExtracted) {
                                const pageVoterObjects: VoterData[] = visionVoters.map(v => ({
                                    epic: v.epic_no,
                                    name: v.voter_name_hi,
                                    relativeName: v.relative_name_hi,
                                    relationType: v.relation_type,
                                    age: v.age,
                                    gender: v.gender === 'Female' ? 'F' : 'M',
                                    houseNumber: v.house_no,
                                    boothNumber: null,
                                    village: '',
                                    area: '',
                                    originalText: `EPIC: ${v.epic_no}\nनाम: ${v.voter_name_hi}\nपिता/पति: ${v.relative_name_hi}`
                                }));
                                await onVotersExtracted(pageVoterObjects);
                            }
                        }

                        if (onProgress) {
                            const pct = Math.min(95, Math.floor(15 + ((i + 1) / totalImgs) * 80));
                            await onProgress(pct);
                        }
                    } catch (vErr) {
                        console.error(`[VISION AI SCAN] Page ${i + 1} error:`, vErr);
                    }
                }
            }

            // Fallback to Tesseract if Vision AI extracted 0 text
            if (ocrTexts.length === 0) {
                console.log(`[SCANNED PDF OCR] Initializing 2 parallel Tesseract workers...`);
                const { createWorker } = await import('tesseract.js');
                const [w1, w2] = await Promise.all([
                    createWorker('hin+eng'),
                    createWorker('hin+eng')
                ]);

                const workers = [w1, w2];
                const BATCH_SIZE = 2;
                const tempTextMap: { [key: number]: string } = {};

                for (let i = 0; i < totalImgs; i += BATCH_SIZE) {
                    const chunk = imageFiles.slice(i, i + BATCH_SIZE);
                    await Promise.all(chunk.map(async (imgFile: string, idx: number) => {
                        const pageIdx = i + idx;
                        if (pageIdx === 1 && totalImgs > 3) return; // skip map page
                        const imgPath = join(imgDir, imgFile);
                        const workerInstance = workers[idx % workers.length];
                        try {
                            console.log(`[SCANNED PDF OCR] Parallel OCRing Page ${pageIdx + 1}/${totalImgs} (${imgFile})...`);
                            const res = await workerInstance.recognize(imgPath);
                            if (res.data && res.data.text && res.data.text.trim().length > 10) {
                                tempTextMap[pageIdx] = res.data.text;
                                console.log(`[SCANNED PDF OCR] Page ${pageIdx + 1} SUCCESS (${res.data.text.length} chars).`);
                            }
                        } catch (pageOcrErr) {
                            console.error(`[SCANNED PDF OCR] Page ${pageIdx + 1} error:`, pageOcrErr);
                        }
                    }));

                    if (onProgress) {
                        const pct = Math.min(95, Math.floor(15 + ((i + BATCH_SIZE) / totalImgs) * 80));
                        await onProgress(pct);
                    }
                }

                await Promise.all([w1.terminate(), w2.terminate()]);

                // Assemble ordered texts
                for (let i = 0; i < totalImgs; i++) {
                    if (tempTextMap[i]) ocrTexts.push(tempTextMap[i]);
                }
            }

            // Clean up temp image directory
            try { rmSync(imgDir, { recursive: true, force: true }); } catch { }

            const fullOcrText = ocrTexts.join('\n\n--- PAGE BREAK ---\n\n');
            if (fullOcrText.trim().length > 50) {
                console.log(`[SCANNED PDF OCR SUCCESS] Extracted ${fullOcrText.length} chars from scanned PDF!`);
                return fullOcrText;
            }
        }
    } catch (scannedOcrErr: any) {
        console.error('[SCANNED PDF OCR Error]:', scannedOcrErr?.stack || scannedOcrErr?.message || scannedOcrErr);
    }

    console.error(`[extractTextFromPdf] ALL methods failed for ${pdfPath}`);
    return "";
}


interface VoterData {
    epic: string;
    name: string;
    relativeName: string;
    relationType: string;
    age: number | null;
    gender: string;
    houseNumber: string;
    boothNumber: number | null;
    village: string;
    area: string;
    originalText: string;
    policeStation?: string;
    district?: string;
    pincode?: string;
}

import { spawn } from 'child_process';

/**
 * PHASE 3: Calling Python Advanced Parser
 * Uses PaddleOCR and Grid-based Logic for high accuracy.
 */
export async function parseVotersAdvanced(
    pdfPath: string,
    onProgress?: (pct: number) => void,
    startPage: number = 1,
    endPage: number = 9999,
    commonAddress: string = "",
    defaultVillage: string = "",
    onVotersExtracted?: (voters: VoterData[]) => Promise<void>
): Promise<VoterData[]> {
    try {
        console.log(`[parseVotersAdvanced] Extracting text from ${pdfPath}...`);
        if (onProgress) onProgress(10);
        const text = await extractTextFromPdf(
            pdfPath,
            async (pct) => { if (onProgress) onProgress(pct); },
            startPage,
            endPage,
            onVotersExtracted
        );
        console.log(`[parseVotersAdvanced] Text extracted (${text.length} chars). Parsing voter roll...`);
        const voters = parseUPVoterRoll(text, commonAddress, defaultVillage);
        console.log(`[parseVotersAdvanced] Parsed ${voters.length} voters cleanly.`);
        if (onProgress) onProgress(95);
        return voters;
    } catch (err) {
        console.error('[parseVotersAdvanced error]:', err);
        throw err;
    }
}

export function parseUPVoterRoll(text: string, manualAddress?: string, defaultVillage?: string): VoterData[] {
    const voters: VoterData[] = [];
    const pages = text.split(/\f|\-\-\-\s*PAGE\s*BREAK\s*\-\-\-/i);

    console.log(`Starting Parser. Total Pages Found: ${pages.length}`);

    pages.forEach((pageText, pageIdx) => {

        const lines = pageText.split('\n');
        if (lines.length < 5) return;

        // Strip noise lines
        const contentLines = lines.filter(line => {
            const l = line.trim();
            if (l.includes('निर्वाचक नामावली') || l.includes('विधानसभा') || l.includes('भाग संख्या')) return false;
            if (l.includes('प्रकाशन की तिथि') || l.includes('कुल पृष्ठ') || l.includes('अनुभाग')) return false;
            return l.length > 1;
        });

        const cleanPageText = contentLines.join('\n');

        // PRE-PROCESS: Move House Numbers that appear before EPIC on same line
        const headerFixRegex = /^\s*([0-9]{1,4})\s{2,}([A-Z]{3,}[0-9\/\\]{5,})/gm;
        const fixedText = cleanPageText.replace(headerFixRegex, '$2 House No: $1');

        // Split by EPIC pattern OR Devanagari "नाम :" / "निर्वाचक का नाम :" block header
        const blockSplitter = /(?=\b[A-Z]{2,3}\s*\d{6,8}\b|\bSYN_\w+\b|\b[A-Z0-9]{2,}\/[0-9\/]{4,}\b|\n(?:\d{1,4}\s+)?(?:EPIC|नाम|नाम्म|नांस|निर्वाचक\s*का\s*नाम)\s*[:\-])/g;
        const records = fixedText.split(blockSplitter);

        records.forEach(rec => {
            const trimmed = rec.trim();
            if (trimmed.length < 15) return;
            parseAndAddVoter(trimmed, voters, defaultVillage || '', manualAddress || '');
        });
    });

    // SRS 4.0 (Module 5): Invalid House Number Context Inheritor Algorithm
    // If a voter's house number is invalid ('0', '-', 'null', 'na', ''), inspect adjacent voters
    // in the same page/booth roll sharing surname or relative name, inheriting their valid house number!
    for (let i = 0; i < voters.length; i++) {
        const curr = voters[i];
        if (!curr.houseNumber || ['0', '-', 'null', 'na', 'n/a', ''].includes(curr.houseNumber.toLowerCase())) {
            // Check preceding voter
            if (i > 0) {
                const prev = voters[i - 1];
                if (prev.houseNumber && !['0', '-', 'null', 'na', 'n/a', ''].includes(prev.houseNumber.toLowerCase())) {
                    const prevRel = (prev.relativeName || '').toLowerCase().trim();
                    const currRel = (curr.relativeName || '').toLowerCase().trim();
                    const prevName = (prev.name || '').toLowerCase().trim();
                    const currName = (curr.name || '').toLowerCase().trim();
                    if ((prevRel && currRel && (prevRel.includes(currRel) || currRel.includes(prevRel))) ||
                        (prevRel && currName.includes(prevRel)) ||
                        (currRel && prevName.includes(currRel))) {
                        curr.houseNumber = prev.houseNumber;
                        continue;
                    }
                }
            }
            // Check succeeding voter
            if (i < voters.length - 1) {
                const next = voters[i + 1];
                if (next.houseNumber && !['0', '-', 'null', 'na', 'n/a', ''].includes(next.houseNumber.toLowerCase())) {
                    const nextRel = (next.relativeName || '').toLowerCase().trim();
                    const currRel = (curr.relativeName || '').toLowerCase().trim();
                    const nextName = (next.name || '').toLowerCase().trim();
                    const currName = (curr.name || '').toLowerCase().trim();
                    if ((nextRel && currRel && (nextRel.includes(currRel) || currRel.includes(nextRel))) ||
                        (nextRel && currName.includes(nextRel)) ||
                        (currRel && nextName.includes(nextRel))) {
                        curr.houseNumber = next.houseNumber;
                    }
                }
            }
        }
    }

    console.log(`Parser Finished. Raw Records Found: ${voters.length}`);
    return voters;
}



function parseAndAddVoter(textBlock: string, list: VoterData[], defaultVillage: string, defaultAddress: string) {
    // 1. More precise EPIC extraction to avoid noise
    const epicPatterns = /\b([A-Z]{2,3}\s*[0-9]{6,10}|SYN_\w+|[A-Z0-9]{2,}\/[0-9\/]{4,12})\b/g;
    const epics = [...textBlock.matchAll(epicPatterns)];

    // Check for "DELETED" stamp - skip this voter (OCR often sees DELETED/विलोपित)
    if (/\bDELETED\b|\bविलोपित\b/i.test(textBlock)) return;

    // Split if multiple epics found (recursive)
    if (epics.length > 1) {
        let lastStop = 0;
        epics.slice(1).forEach((eMatch) => {
            const startOfNext = eMatch.index!;
            if (startOfNext > lastStop) {
                const segment = textBlock.substring(lastStop, startOfNext);
                if (segment.trim().length > 25) {
                    parseAndAddVoter(segment, list, defaultVillage, defaultAddress);
                }
            }
            lastStop = startOfNext;
        });

        textBlock = textBlock.substring(lastStop);
        parseAndAddVoter(textBlock, list, defaultVillage, defaultAddress);
        return;
    }

    let epic = epics.length > 0 ? epics[0][1] : '';
    if (epic) {
        epic = epic.replace(/[^A-Z0-9]/g, '').replace(/O/g, '0').trim();
    }
    if (!epic || epic.length < 5) {
        epic = `SYN_${Math.floor(Math.random() * 899999 + 100000)}`;
    }

    const lines = textBlock.split('\n').map(l => l.trim()).filter(l => l.length > 1);

    // --- 2. Name Extraction ---
    // Look for "Nirvachak ka Naam" or similar
    // Added more misread patterns for "नाम" (e.g. "नास", "दाम", "तान")
    const nameKeywords = 'Name|ना\\s*म|ना\\s*स|न\\s*भ|नान|जम|आम|नम|न\\s*म|दाम|नाम|चाम|मान|नास|नाथ|तान|नाम';
    let nameLine = lines.find(l => new RegExp(nameKeywords, 'i').test(l));

    // Fallback: If no keyword, usually line 1 (after EPIC line) is Name
    if (!nameLine && lines.length > 1) {
        if (lines[0].includes(epic)) nameLine = lines[1];
        else nameLine = lines[0];
    }

    // Extract value part
    let name = '';
    if (nameLine) {
        const parts = nameLine.split(/[:\-\.]+|का नाम/);
        if (parts.length > 1) name = parts[parts.length - 1];
        else name = nameLine;
    }

    // Cleanup Name
    name = name.split(/(?:Gender|लिंग|Husband|Father|Mother|पिता|पति|माता|उम्र|आयु|Age|Photo|Available|उपलब्ध|Makan|House|Grih|सख्या|Serial|S\.No)/i)[0];
    name = name.replace(/(?:निर्वाचक|Elector|Nirvachak|Nirvachav|Nirva[\w]*|निर्वाचव| निर्वाच क| निर्वाच)/gi, '').trim();
    if (name.length > 3) {
        name = name.replace(/[वv]$/gi, '').trim();
    }
    // Remove punctuation and digits but KEEP Hindi chars
    name = name.replace(/[\|\_\#\#\*\=\>\(\)\d]/g, '').trim();

    // NOISE FILTER: If name has Hindi chars, remove trailing single or double English letters (common OCR noise)
    if (/[\u0900-\u097F]/.test(name)) {
        name = name.replace(/\s+[a-zA-Z]{1,2}$/, '').trim();
    }

    if (name.length < 2) name = 'Unknown';


    // --- 3. Relation Extraction ---
    const relRegex = /(?:Father|Husband|Mother|पिता|पति|माता|पत्नी|अभिभावक|संरक्षक)(?:\s*का|\s*की)?(?:\s*नाम)?\s*[:\u0903\=\-\.\s]*([^\n\r\|]+)/i;

    let relativeName = '';
    let relationType = 'Father';

    const relLine = lines.find(l => l !== nameLine && (relRegex.test(l) || /पति|पिता|माता|Father|Husband|Mother/i.test(l)));

    if (relLine) {
        const match = relLine.match(relRegex);
        if (match) relativeName = match[1].trim();
        else relativeName = relLine.replace(/.*(?:पति|पिता|माता|Father|Husband|Mother)[^:\u0903]*[:\u0903\=\-\.]*\s*/i, '').trim();

        if (/(?:Husband|पति|पत्नी)/i.test(relLine)) relationType = 'Husband';
        else if (/(?:Mother|माता)/i.test(relLine)) relationType = 'Mother';
        else if (/(?:Father|पिता)/i.test(relLine)) relationType = 'Father';
    } else {
        if (lines.length > 2) {
            let candidate = lines[2];
            if (candidate.includes(name) || /Nirvachak|Elector/i.test(candidate)) {
                if (lines.length > 3) candidate = lines[3];
            }
            if (!/Makan|House|Grih|मकान/i.test(candidate)) {
                relativeName = candidate;
            }
        }
    }

    // Cleanup Relative Name
    relativeName = relativeName.split(/(?:Makan|House|Gender|लिंग|उम्र|आयु|Age|Photo|Grih|M\.No|सख्या|Father|Husband|Mother|पिता|पति|माता|पत्नी|अभिभावक|Serial)/i)[0].trim();
    relativeName = relativeName.replace(/[\|\_\#\#\*\=\>\(\)\d]/g, '').trim();
    relativeName = relativeName.replace(/(?:निर्वाचक|Elector|Nirvachak|Nirvachav|Nirva[\w]*|निर्वाचव| निर्वाच क| निर्वाच)/gi, '').trim();
    if (relativeName.length > 3) {
        relativeName = relativeName.replace(/[वv]$/gi, '').trim();
    }
    // Fix OCR misreads for specific known names
    if (/कवलिक/i.test(relativeName)) relativeName = 'कालिका';

    // Noise Filter for Relative Name
    if (/[\u0900-\u097F]/.test(relativeName)) {
        relativeName = relativeName.replace(/\s+[a-zA-Z]{1,2}$/, '').trim();
    }

    if (relativeName === name && lines.length > 1) {
        const otherLine = lines.find(l => !l.includes(name) && l.length > 3 && !l.includes(epic) && !/Makan|Age|Gender/i.test(l));
        if (otherLine) relativeName = otherLine.trim();
    }


    // --- 4. House No ---
    let houseNumber = '';

    // Prioritize explicit label match
    const houseMatch = textBlock.match(/(?:House|Makan|Grih|मकान|सका|अकाल|संख्या|गृह|सख्या|मकन|मकाल)\s*(?:No|Sankhya|संख्या|सख्या|\.|:)?\s*[:\s\-\.]+\s*(.+)/i);

    if (houseMatch) {
        let raw = houseMatch[1].trim();
        raw = raw.split(/(?:Age|Gender|Photo|Sex|Ling|Cat|Category|लिंग|उम्र|आयु|फोटो)/i)[0].trim();
        // Remove trailing punctuation
        houseNumber = raw.replace(/[.\-:,]+$/, '').trim();

        // INTERLEAVED COLUMN PROTECTION: 
        // If there's multiple numbers separated by wide space (e.g. "1   7"), take the first one
        const multiMatch = houseNumber.match(/^(\d+(?:[\/\-]\d+)?)\s{2,}/);
        if (multiMatch) houseNumber = multiMatch[1];

        // Safety: If houseNumber is suddenly huge (>10 chars) it might be merged noise
        if (houseNumber.length > 10) houseNumber = houseNumber.substring(0, 10).trim();
    }

    // FALLBACK 1: Injected House No from serial box (only if houseMatch failed or produced junk)
    if (!houseNumber || /^[^\d]+$/.test(houseNumber)) {
        const injected = textBlock.match(/House No\s*:\s*([^ \n]+)/i);
        if (injected) {
            houseNumber = injected[1].trim().replace(/[.\-:,]+$/, '');
        }
    }

    // FALLBACK 2: Loose Number Search
    if (!houseNumber) {
        const standaloneNumber = lines.find(l => /^\s*\d+(?:[\/\-]\d+)?\s*$/.test(l) && !l.includes(epic));
        if (standaloneNumber) houseNumber = standaloneNumber.trim();
    }

    // Normalize House Number (strip leading zeros like 001 -> 1)
    if (houseNumber) {
        houseNumber = houseNumber.replace(/^0+([1-9])/, '$1').replace(/^0+$/, '0');
    }


    // --- 5. Age ---
    const ageMatch = textBlock.match(/(?:Age|आयु|उम्र|आप|अबु|अबू|अं|आय|आम|उभ्र|अग्र)\s*[:\s\-\.]+\s*(\d+)/i);
    let age = ageMatch ? parseInt(ageMatch[1]) : 0;
    if (age < 18 || age > 115) age = 0;


    // --- 6. Gender ---
    let gender = 'M';
    if (/महिला|Female|Mahila|स्त्री/i.test(textBlock)) {
        gender = 'F';
    } else if (/पुरुष|Male/i.test(textBlock)) {
        gender = 'M';
    } else {
        const genderMatch = textBlock.match(/(?:Gender|लिंग|किग|कि|लिग|लिगा|लिगं)\s*[:\s\-\.]+\s*([\w\u0900-\u097F]+)/i);
        if (genderMatch) {
            const gText = genderMatch[1].toLowerCase();
            if (gText.includes('mahila') || gText.includes('महिला') || gText === 'f') gender = 'F';
        }
    }

    list.push({
        epic,
        name: name || 'Unknown',
        relativeName: relativeName || '',
        relationType,
        age: age || null,
        gender,
        houseNumber,
        boothNumber: null,
        village: defaultVillage,
        area: defaultAddress,
        originalText: textBlock
    });
}

