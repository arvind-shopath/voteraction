const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

async function askGemini(base64Image, prompt) {
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    for (const modelName of models) {
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
                const data = await res.json();
                return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }
        } catch (e) {
            console.error(`Gemini model ${modelName} error:`, e.message);
        }
    }
    return '';
}

async function main() {
    const gazipurDir = 'C:\\Users\\creatiAV\\Documents\\voteraction\\gazipur';
    const pdftocairoBin = path.join(process.cwd(), 'node_modules', 'pdf-poppler', 'lib', 'win', 'poppler-0.51', 'bin', 'pdftocairo.exe');

    if (!fs.existsSync(gazipurDir)) {
        console.log("Gazipur dir not found!");
        return;
    }

    const files = fs.readdirSync(gazipurDir).filter(f => f.endsWith('.pdf'));
    console.log(`=== EXAMINING ALL ${files.length} PDFs IN GAZIPUR DIR ===\n`);

    const boothInfoList = [];

    for (const f of files) {
        const pdfPath = path.join(gazipurDir, f);
        const m = f.match(/HIN-(\d+)-WI/i) || f.match(/(\d+)/);
        const boothNo = m ? parseInt(m[1]) : 0;

        const outPrefix = path.join(__dirname, `temp_b${boothNo}`);

        try {
            // Render Page 1 and Page 2
            execSync(`"${pdftocairoBin}" -png -r 150 -f 1 -l 3 "${pdfPath}" "${outPrefix}"`);

            const p1Img = `${outPrefix}-01.png`;
            const p2Img = `${outPrefix}-02.png`;

            let boothName = "";
            let sections = [];

            if (fs.existsSync(p1Img)) {
                const imgBuf = fs.readFileSync(p1Img);
                const p1Text = await askGemini(imgBuf.toString('base64'), 
                    `Analyze Section 3 'मतदान स्थल का विवरण' and '1 - मुख्य ग्राम / अनुभाग' on this Page 1 of UP Voter Roll PDF.
                    Extract JSON object ONLY:
                    {
                        "boothNumber": 8,
                        "boothName": "Exact Polling Station Name (e.g. प्रा०वि० सालिकपुर स्थित ग्राम अन्धोखर or प्रा०वि० सौरी)",
                        "sections": ["1-सालिकपुर", "2-अन्धोखर"]
                    }`
                );

                try {
                    const cleanJson = p1Text.replace(/```json/gi, '').replace(/```/g, '').trim();
                    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        boothName = parsed.boothName || "";
                        sections = parsed.sections || [];
                    }
                } catch (e) {
                    console.log("P1 Raw:", p1Text);
                }
                fs.unlinkSync(p1Img);
            }

            if (fs.existsSync(p2Img)) fs.unlinkSync(p2Img);
            const p3Img = `${outPrefix}-03.png`;
            if (fs.existsSync(p3Img)) fs.unlinkSync(p3Img);

            console.log(`📍 Booth #${boothNo} (${f}):`);
            console.log(`   Name: ${boothName || "Not extracted"}`);
            console.log(`   Sections/Villages: ${sections.join(', ')}\n`);

            boothInfoList.push({ boothNo, fileName: f, boothName, sections });
        } catch (e) {
            console.error(`Error on ${f}:`, e.message);
        }
    }

    console.log("\n=== ALL BOOTHS SUMMARY ===");
    console.table(boothInfoList);
}

main().catch(console.error);
