
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function extractTextFromPdf(pdfPath: string, onProgress?: (pct: number) => Promise<void>, startPage?: number, endPage?: number): Promise<string> {
    const tempTxtPath = pdfPath.replace('.pdf', '.txt');
    try {
        let first = startPage || 1;
        let last = endPage || 9999;

        // Safety: swap if reversed
        if (first > last) {
            const temp = first;
            first = last;
            last = temp;
        }

        console.log(`Extracting PDF Text. Pages: ${first} to ${last}`);

        await execAsync(`pdftotext -f ${first} -l ${last} -layout -enc UTF-8 "${pdfPath}" "${tempTxtPath}"`);
        let text = await readFile(tempTxtPath, 'utf-8');

        if (text.trim().length < 100) {
            console.log('Using Advanced Split OCR (Overlap Mode)...');
            const imageDir = pdfPath + '_images';
            await execAsync(`mkdir -p "${imageDir}"`);

            try {
                const totalPageLines = await execAsync(`pdfinfo "${pdfPath}" | grep Pages | awk '{print $2}'`);
                const actualTotal = parseInt(totalPageLines.stdout.trim()) || 50;

                const finalStart = Math.max(1, startPage || 1);
                const finalEnd = Math.min(actualTotal, endPage || actualTotal, finalStart + 110);

                const ocrTexts: string[] = [];
                for (let p = finalStart; p <= finalEnd; p++) {
                    if (onProgress) {
                        const totalToProcess = finalEnd - finalStart + 1;
                        const currentProcessed = p - finalStart + 1;
                        const pct = 10 + Math.floor((currentProcessed / totalToProcess) * 30);
                        await onProgress(pct);
                    }
                    console.log(`Processing Page ${p}/${actualTotal}...`);

                    // Optimized column mapping for standard 3-column A4 (2480px @ 300dpi)
                    // Reduced width to avoid capturing fragments of adjacent columns
                    const pageHeight = 3509;
                    const columns = [
                        { x: 0, w: 840 },
                        { x: 820, w: 840 },
                        { x: 1640, w: 840 }
                    ];

                    let pageContent = "";
                    for (let c = 0; c < columns.length; c++) {
                        const col = columns[c];
                        const colTxtBase = join(imageDir, `p${p}_c${c}`);

                        // Extract column
                        await execAsync(`pdftoppm -png -r 300 -f ${p} -l ${p} -x ${col.x} -y 0 -W ${col.w} -H ${pageHeight} "${pdfPath}" "${colTxtBase}_raw"`);

                        const rawFiles = await execAsync(`ls ${colTxtBase}_raw*.png`);
                        const actualImg = rawFiles.stdout.trim().split('\n')[0];

                        // OCR with optimized PSM (6 for uniform block of text)
                        await execAsync(`tesseract "${actualImg}" "${colTxtBase}" -l hin+eng --psm 6`);
                        const colText = await readFile(`${colTxtBase}.txt`, 'utf-8');
                        pageContent += colText + "\n";
                    }
                    ocrTexts.push(pageContent);
                }
                text = ocrTexts.join('\n\f\n');
                await execAsync(`rm -rf "${imageDir}"`);
            } catch (err) {
                console.error('OCR Error:', err);
                await execAsync(`rm -rf "${imageDir}"`).catch(() => { });
                if (text.length < 100) throw new Error('OCR Failed or produced no text');
            }
        }
        return text;
    } catch (error) {
        console.error('PDF Extraction Failed:', error);
        throw error;
    }
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
}

import { spawn } from 'child_process';

/**
 * PHASE 3: Calling Python Advanced Parser
 * Uses PaddleOCR and Grid-based Logic for high accuracy.
 */
export async function parseVotersAdvanced(
    pdfPath: string,
    onProgress?: (pct: number) => Promise<void>,
    startPage: number = 1,
    endPage: number = 9999,
    commonAddress: string = "",
    defaultVillage: string = ""
): Promise<VoterData[]> {
    return new Promise((resolve, reject) => {
        try {
            console.log(`Starting Advanced Python Parser for ${pdfPath}, pages ${startPage}-${endPage}`);

            const venvPythonPath = join(process.cwd(), 'ocr_venv', 'bin', 'python3');
            const scriptPath = join(process.cwd(), 'scripts', 'box_parser.py');

            const child = spawn(venvPythonPath, [scriptPath, pdfPath, String(startPage), String(endPage)]);

            let stdoutData = "";
            let stderrData = "";

            if (onProgress) onProgress(15);

            child.stdout.on('data', (data) => {
                stdoutData += data.toString();
            });

            child.stderr.on('data', (data) => {
                const lines = data.toString().split('\n');
                for (const line of lines) {
                    if (!line.trim()) continue;
                    console.log(`[Python Parser Stderr] ${line.trim()}`);
                    stderrData += line + '\n';

                    // Extract progress if possible from markers like "--- Page 3: Found 30 boxes ---"
                    const pageMatch = line.match(/Page (\d+):/);
                    if (pageMatch && onProgress) {
                        const currentPage = parseInt(pageMatch[1]);
                        const totalToProcess = endPage - startPage + 1;
                        if (totalToProcess > 0) {
                            const completed = currentPage - startPage;
                            const pct = 15 + Math.floor((completed / totalToProcess) * 75);
                            onProgress(Math.min(90, pct));
                        }
                    }
                }
            });

            child.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Python Parser exited with code ${code}`);
                    return reject(new Error(`Python Parser failed (Code ${code}). Check logs for details.`));
                }

                try {
                    const jsonStart = stdoutData.indexOf('[') !== -1 ? stdoutData.indexOf('[') : stdoutData.indexOf('{');
                    const cleanStdout = jsonStart !== -1 ? stdoutData.substring(jsonStart).trim() : stdoutData.trim();
                    const results = JSON.parse(cleanStdout || '[]');

                    if (results.error) {
                        return reject(new Error(results.error));
                    }

                    if (onProgress) onProgress(90);

                    // Map results to VoterData structure
                    const mapped = results.map((v: any) => ({
                        ...v,
                        boothNumber: null,
                        village: v.village || defaultVillage,
                        area: v.area || commonAddress
                    }));
                    resolve(mapped);
                } catch (e) {
                    console.error('Failed to parse Python JSON output:', e);
                    reject(new Error('Invalid output format from Parser'));
                }
            });

            child.on('error', (err) => {
                console.error('Failed to start Python process:', err);
                reject(err);
            });

        } catch (error) {
            console.error('Advanced Parser Error:', error);
            reject(error);
        }
    });
}

export function parseUPVoterRoll(text: string, manualAddress?: string, defaultVillage?: string): VoterData[] {
    const voters: VoterData[] = [];
    const pages = text.split('\f');

    console.log(`Starting Parser. Total Pages Found: ${pages.length}`);

    pages.forEach((pageText, pageIdx) => {

        const lines = pageText.split('\n');
        if (lines.length < 10) return;

        // Strip noise lines
        const contentLines = lines.filter(line => {
            const l = line.trim();
            if (l.includes('निर्वाचक नामावली') || l.includes('विधानसभा') || l.includes('भाग संख्या')) return false;
            if (l.includes('प्रकाशन की तिथि') || l.includes('कुल पृष्ठ') || l.includes('अनुभाग')) return false;
            return l.length > 2;
        });

        const cleanPageText = contentLines.join('\n');

        // IMPROVED SPLIT: EPICs usually look like letters followed by digits, 
        // but OCR can add spaces or noise. We look for a pattern that anchors a block.
        // We look for [Letters][Digits] or similar at the start of a potential block

        // PRE-PROCESS: Move House Numbers that appear before EPIC on same line
        // e.g. "1       NUC0600098" -> "NUC0600098 House No: 1"
        // Increased safety: ensure the serial number is followed by a clear long gap or is just 1-4 digits
        const headerFixRegex = /^\s*([0-9]{1,4})\s{2,}([A-Z]{3,}[0-9\/\\]{5,})/gm;
        const fixedText = cleanPageText.replace(headerFixRegex, '$2 House No: $1');

        // Split by EPIC-like pattern at word boundary
        // EPICs are usually 3 letters + 7 digits OR Alphanumeric 10 chars
        const records = fixedText.split(/(?=\b[A-Z]{3,}\s*\d{7}\b|\b[A-Z0-9]{3,}\/[0-9\/]{6,}\b)/g);

        records.forEach(rec => {
            const trimmed = rec.trim();
            if (trimmed.length < 30) return;
            parseAndAddVoter(trimmed, voters, defaultVillage || '', manualAddress || '');
        });
    });

    console.log(`Parser Finished. Raw Records Found: ${voters.length}`);
    return voters;
}



function parseAndAddVoter(textBlock: string, list: VoterData[], defaultVillage: string, defaultAddress: string) {
    // 1. More precise EPIC extraction to avoid noise
    const epicPatterns = /\b([A-Z]{3,}\s*[0-9]{7}|[A-Z0-9]{2,}\/[0-9\/]{5,})\b/g;
    const epics = [...textBlock.matchAll(epicPatterns)];

    if (epics.length === 0) return;

    // Check for "DELETED" stamp - skip this voter (OCR often sees DEL/TED/विलोपित)
    if (/DELETED|Deleted|DEL|TED|विलोपित|विलोपित/i.test(textBlock)) return;

    // Split if multiple epics found (recursive)
    if (epics.length > 1) {
        let lastStop = 0;
        epics.slice(1).forEach((eMatch) => {
            const startOfNext = eMatch.index!;
            // Process the segment up to the next EPIC
            if (startOfNext > lastStop) {
                const segment = textBlock.substring(lastStop, startOfNext);
                // Recursively add segment
                if (segment.trim().length > 30) {
                    parseAndAddVoter(segment, list, defaultVillage, defaultAddress);
                }
            }
            lastStop = startOfNext;
        });

        // Process the final segment (the last EPIC block) as the "current" textBlock
        textBlock = textBlock.substring(lastStop);
        // Re-evaluate EPICs for this single block (should be just one now)
        // Actually, we can just let it fall through, but we need to re-match the EPIC for *this* block
        // Simpler: Just recursively call for the last block too and return!
        parseAndAddVoter(textBlock, list, defaultVillage, defaultAddress);
        return;
    }

    let epic = epics[0][1];
    // Clean EPIC of ALL non-alphanumeric noise
    epic = epic.replace(/[^A-Z0-9]/g, '').replace(/O/g, '0').trim();

    // Voter records must have a reasonable length EPIC
    // Most modern EPICs are 10 chars, some older ones are 8-12. 
    // If it's too short (noise), skip.
    if (epic.length < 7) return;

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
    const relKeywords = 'Father|Husband|Mother|पिता|पति|माता|पत्नी|अभिभावक|भता|पता|संरक्षक|गिता|पदि';
    const relRegex = new RegExp(`(?:${relKeywords})(?:\\s+का\\s+नाम)?\\s*[:\\s\\-\\.]+\\s*([^\\n\\r\\|]+)`, 'i');

    let relativeName = '';
    let relationType = 'Father';

    const relLine = lines.find(l => l !== nameLine && relRegex.test(l));

    if (relLine) {
        const match = relLine.match(relRegex);
        if (match) relativeName = match[1].trim();

        if (relLine.match(/(?:Husband|पति|पत्नी)/i)) relationType = 'Husband';
        else if (relLine.match(/(?:Mother|माता)/i)) relationType = 'Mother';
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
        // Also handles "1 / 7" if it's actually one address, so we check for WIDE space
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


    // --- 5. Age ---
    const ageMatch = textBlock.match(/(?:Age|आयु|उम्र|आप|अबु|अबू|अं|आय|आम|उभ्र|अग्र)\s*[:\s\-\.]+\s*(\d+)/i);
    let age = ageMatch ? parseInt(ageMatch[1]) : 0;
    if (age < 18 || age > 115) age = 0;


    // --- 6. Gender ---
    const genderMatch = textBlock.match(/(?:Gender|लिंग|किग|कि|लिंग|लिग|लिगा|लिगं)\s*[:\s\-\.]+\s*([\w\u0900-\u097F]+)/i);
    let gender = 'M';
    if (genderMatch) {
        const gText = genderMatch[1].toLowerCase();
        if (gText.includes('mahila') || gText.includes('महिला') || gText.includes('f') || gText.includes('नह') || gText.includes('हि') || gText.includes('म') || gText.includes('मि') || gText.includes('मह')) gender = 'F';
    } else {
        if (/महिला|Mahila|Female/i.test(textBlock)) gender = 'F';
    }
    if (relationType === 'Husband') gender = 'F';

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

