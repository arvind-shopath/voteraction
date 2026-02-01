
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function extractTextFromPdf(pdfPath: string, onProgress?: (pct: number) => Promise<void>, startPage?: number, endPage?: number): Promise<string> {
    const tempTxtPath = pdfPath.replace('.pdf', '.txt');
    try {
        const first = startPage || 1;
        const last = endPage || 9999;

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

                    // Increased overlap to ensure NO record is cut off
                    // Overlapping zones: 0-950, 750-1700, 1500-2480
                    const pageHeight = 3509;
                    const columns = [
                        { x: 0, w: 950 },
                        { x: 750, w: 950 },
                        { x: 1500, w: 1000 }
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
        const records = cleanPageText.split(/(?=\b[A-Z0-9]{2,}\s*[0-9\/]{6,}\b)/g);

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
    // 1. More permissive EPIC extraction to handle OCR noise like 'XEO 2809614' or 'XEO-2809614'
    const epicPatterns = /([A-Z0-9]{2,}[-\s\/\\]*[0-9]{4,}[-\s\/\\]*[0-9]{2,}|[A-Z]{3}\s*\d{7})/g;
    const epics = [...textBlock.matchAll(epicPatterns)];

    if (epics.length === 0) return;

    if (epics.length > 1) {
        let lastStop = 0;
        epics.slice(1).forEach((eMatch) => {
            const startOfNext = eMatch.index!;
            const segment = textBlock.substring(lastStop, startOfNext);
            parseAndAddVoter(segment, list, defaultVillage, defaultAddress);
            lastStop = startOfNext;
        });
        parseAndAddVoter(textBlock.substring(lastStop), list, defaultVillage, defaultAddress);
        return;
    }

    let epic = epics[0][1];
    // Clean EPIC of ALL non-alphanumeric noise
    epic = epic.replace(/[^A-Z0-9]/g, '').replace(/O/g, '0').trim();

    // Voter records must have a reasonable length EPIC
    if (epic.length < 8) return;

    const lines = textBlock.split('\n').map(l => l.trim()).filter(l => l.length > 1);

    // 2. Extra synonyms for Hindi labels
    const nameKeywords = 'Name|ना\\s*म|ना\\s*स|न\\s*भ|नान|जम|आम|नम|न\\s*म|दाम|नाम|चाम|मान|नास';
    const nameMatch = textBlock.match(new RegExp(`(?:${nameKeywords})\\s*[:\\s\\-\\.]+\\s*([^\\n\\r\\|]+)`, 'i'));
    let name = nameMatch ? nameMatch[1].trim() : '';

    if (!name && lines.length > 1) {
        if (lines[0].includes(epic)) name = lines[1];
        else name = lines[0];
    }

    name = name.split(/(?:Gender|लिंग|Husband|Father|Mother|पिता|पति|माता|उम्र|आयु|Age|Photo|Available|उपलब्ध|Makan|House|Grih|सख्या)/i)[0].trim();
    name = name.replace(/[\|\_\#\#\*\=\>\(\)\d]/g, '').trim();
    if (name.length < 2) name = 'Unknown';

    // 3. Relation Extraction
    const relKeywords = 'Father|Husband|Mother|पिता|पति|माता|अत|के|का|पत्नी|अभिभावक|भता|पता';
    const relMatch = textBlock.match(new RegExp(`(?:${relKeywords})(?:\\s+का\\s+नाम)?\\s*[:\\s\\-\\.]+\\s*([^\\n\\r\\|]+)`, 'i'));
    let relativeName = relMatch ? relMatch[1].trim() : '';

    if (!relativeName && lines.length > 2) {
        relativeName = lines[2];
    }
    relativeName = relativeName.split(/(?:Makan|House|Gender|लिंग|उम्र|आयु|Age|Photo|Grih|M\.No|सख्या)/i)[0].trim();
    relativeName = relativeName.replace(/[\|\_\#\#\*\=\>\(\)\d]/g, '').trim();

    let relationType = 'Father';
    if (textBlock.match(/(?:Husband|पति|पत्नी)/i)) relationType = 'Husband';
    else if (textBlock.match(/(?:Mother|माता)/i)) relationType = 'Mother';

    // 4. House No
    const houseMatch = textBlock.match(/(?:House|Makan|Grih|मकान|सका|अकाल|संख्या|गृह|सख्या)\s*(?:No|Sankhya|संख्या|सख्या)?\s*[:\s\-\.]+\s*([\w\d\/\-]+)/i);
    const houseNumber = houseMatch ? houseMatch[1].trim() : '';

    // 5. Age
    const ageMatch = textBlock.match(/(?:Age|आयु|उम्र|आप|अबु|अबू|अं|आय|आम)\s*[:\s\-\.]+\s*(\d+)/i);
    let age = ageMatch ? parseInt(ageMatch[1]) : 0;
    if (age < 18 || age > 115) age = 0;

    // 6. Gender
    const genderMatch = textBlock.match(/(?:Gender|लिंग|किग|कि|लिंग|लिग)\s*[:\s\-\.]+\s*([\w\u0900-\u097F]+)/i);
    let gender = 'M';
    if (genderMatch) {
        const gText = genderMatch[1].toLowerCase();
        if (gText.includes('mahila') || gText.includes('महिला') || gText.includes('f') || gText.includes('नह') || gText.includes('हि') || gText.includes('म') || gText.includes('मि')) gender = 'F';
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
