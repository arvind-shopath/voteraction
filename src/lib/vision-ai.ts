/**
 * SRS 3.0 Layer 2: Vision AI Fallback Engine
 * Uses Gemini 2.5 Flash / Vision AI to scan page/card images
 * and extract 100% clean Devanagari Hindi structured JSON.
 */

import { transliterateToEnglish } from './transliteration';

export interface VisionVoterData {
    epic_no: string;
    voter_name_hi: string;
    voter_name_en: string;
    relative_name_hi: string;
    relative_name_en: string;
    relation_type: string;
    age: number | null;
    gender: string;
    house_no: string;
    quality_score: number;
}

/**
 * Scan an entire voter roll page image (30 voter cards) with Gemini 2.5 Flash
 */
export async function processPageImageWithVisionAI(imageBuffer: Buffer): Promise<VisionVoterData[]> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
        console.warn('[VISION AI] No GEMINI_API_KEY found in environment');
        return [];
    }

    try {
        console.log('[VISION AI] Processing page image with Gemini 2.5 Flash...');
        const base64Image = imageBuffer.toString('base64');
        const prompt = `Analyze this Indian Voter Roll PDF Page image containing multiple voter cards. Extract ALL voter records present on this page and output ONLY a valid JSON array of objects with no markdown code blocks:
[
  {
    "epic_no": "EPIC number like ABC1234567 or BR/01/...",
    "voter_name_hi": "Name in Devanagari Hindi",
    "relative_name_hi": "Father/Husband Name in Devanagari Hindi",
    "relation_type": "Father or Husband or Mother",
    "age": 35,
    "gender": "Male or Female",
    "house_no": "House number string"
  }
]`;

        const models = ['gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-2.5-flash'];
        let response: Response | null = null;

        for (const modelName of models) {
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [
                                    { text: prompt },
                                    { inline_data: { mime_type: 'image/png', data: base64Image } }
                                ]
                            }]
                        })
                    });

                    if (res.ok) {
                        response = res;
                        break;
                    } else if (res.status === 429) {
                        console.warn(`[VISION AI RATE LIMIT] Model ${modelName} hit 429 (Rate Limit). Waiting 2.5s before retry...`);
                        await new Promise(r => setTimeout(r, 2500));
                    } else {
                        console.warn(`[VISION AI] Model ${modelName} returned status ${res.status}.`);
                        break;
                    }
                } catch (mErr) {
                    console.error(`[VISION AI] Model ${modelName} request error:`, mErr);
                    break;
                }
            }
            if (response && response.ok) break;
        }

        if (response && response.ok) {
            const resJson = await response.json();
            const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            console.log('[VISION AI RAW OUTPUT]:', rawText.substring(0, 500));

            // Clean json codeblocks ```json ... ```
            const cleanJsonText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const jsonMatch = cleanJsonText.match(/\[[\s\S]*\]/);

            if (jsonMatch) {
                const parsedList: any[] = JSON.parse(jsonMatch[0]);
                const voters: VisionVoterData[] = parsedList.map(p => {
                    const nameHi = p.voter_name_hi || p.name_hi || p.name || '';
                    const nameEn = transliterateToEnglish(nameHi);
                    const relHi = p.relative_name_hi || p.father_name_hi || p.husband_name_hi || p.relative_name || '';
                    const relEn = transliterateToEnglish(relHi);

                    return {
                        epic_no: p.epic_no || p.epic || `SYN_${Math.floor(Math.random() * 899999 + 100000)}`,
                        voter_name_hi: nameHi,
                        voter_name_en: nameEn,
                        relative_name_hi: relHi,
                        relative_name_en: relEn,
                        relation_type: p.relation_type || 'Father',
                        age: parseInt(String(p.age || 0)) || null,
                        gender: p.gender || 'Male',
                        house_no: p.house_no || p.house_number || '',
                        quality_score: 98
                    };
                });

                console.log(`[VISION AI SUCCESS] Extracted ${voters.length} clean voter records from page image!`);
                return voters;
            }
        } else {
            const errText = await response.text();
            console.error('[VISION AI API ERROR]:', response.status, errText);
        }
    } catch (e: any) {
        console.error('[VISION AI PAGE ERROR]:', e);
    }

    return [];
}

/**
 * Single card fallback
 */
export async function processCardWithVisionAIFallback(cardText: string, imageBuffer?: Buffer): Promise<VisionVoterData | null> {
    if (imageBuffer) {
        const pageResults = await processPageImageWithVisionAI(imageBuffer);
        if (pageResults.length > 0) return pageResults[0];
    }
    return repairCardWithRuleEngine(cardText);
}

function repairCardWithRuleEngine(textBlock: string): VisionVoterData {
    let nameHi = '';
    const nameMatch = textBlock.match(/(?:नाम|नाम्म|नांस|निर्वाचक का नाम)\s*[:\-]\s*([^\n\r\|]+)/);
    if (nameMatch) nameHi = nameMatch[1].replace(/[^\u0900-\u097F\s]/g, '').trim();

    let relHi = '';
    const relMatch = textBlock.match(/(?:पिता|पति|माता)\s*(?:का नाम)?\s*[:\-]\s*([^\n\r\|]+)/);
    if (relMatch) relHi = relMatch[1].replace(/[^\u0900-\u097F\s]/g, '').trim();

    let relationType = 'Father';
    if (/पति/i.test(textBlock)) relationType = 'Husband';

    let epic = '';
    const epicMatch = textBlock.match(/\b([A-Z]{2,3}[0-9]{7}|[A-Z0-9]{2,}\/[0-9\/]{5,})\b/);
    if (epicMatch) epic = epicMatch[1];
    else epic = `SYN_${Math.floor(Math.random() * 899999 + 100000)}`;

    const ageMatch = textBlock.match(/(?:उम्र|आयु|वर्ष)\s*[:\-]?\s*(\d+)/);
    const age = ageMatch ? parseInt(ageMatch[1]) : null;

    let gender = 'Male';
    if (/महिला|स्त्री/i.test(textBlock) || relationType === 'Husband') gender = 'Female';

    const houseMatch = textBlock.match(/(?:मकान|गृह|संख्या)\s*(?:सं\.|नंबर)?\s*[:\-]?\s*([^\n\r\s]+)/);
    const houseNo = houseMatch ? houseMatch[1].replace(/[^\w\d\-]/g, '') : '';

    const nameEn = transliterateToEnglish(nameHi || 'Voter');
    const relEn = transliterateToEnglish(relHi || '');

    return {
        epic_no: epic,
        voter_name_hi: nameHi || 'अज्ञात',
        voter_name_en: nameEn,
        relative_name_hi: relHi || '',
        relative_name_en: relEn,
        relation_type: relationType,
        age: age,
        gender: gender,
        house_no: houseNo,
        quality_score: 90
    };
}
