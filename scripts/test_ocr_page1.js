const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function scanImage(imgPath, prompt) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const imgBuffer = fs.readFileSync(imgPath);
    const base64Data = imgBuffer.toString("base64");

    const response = await model.generateContent([
        {
            inlineData: {
                data: base64Data,
                mimeType: "image/png"
            }
        },
        prompt
    ]);

    return response.response.text();
}

async function main() {
    const gazipurDir = 'C:\\Users\\creatiAV\\Documents\\voteraction\\gazipur';
    const pdftocairoBin = path.join(process.cwd(), 'node_modules', 'pdf-poppler', 'lib', 'win', 'poppler-0.51', 'bin', 'pdftocairo.exe');

    const filesToTest = [
        '2026-EROLLGEN-S24-375-SIR-DraftRoll-Revision1-HIN-7-WI.pdf',
        '2026-EROLLGEN-S24-375-SIR-DraftRoll-Revision1-HIN-8-WI.pdf'
    ];

    for (const f of filesToTest) {
        const pdfPath = path.join(gazipurDir, f);
        const outPrefix = path.join(__dirname, f.replace('.pdf', ''));

        console.log(`\n==================================================`);
        console.log(`RENDERING & OCRing: ${f}`);

        // Render Page 1 to 3
        execSync(`"${pdftocairoBin}" -png -r 150 -f 1 -l 3 "${pdfPath}" "${outPrefix}"`);

        const p1Img = `${outPrefix}-01.png`;
        const p2Img = `${outPrefix}-02.png`;
        const p3Img = `${outPrefix}-03.png`;

        if (fs.existsSync(p1Img)) {
            console.log(`--- Page 1 OCR (Cover Details) ---`);
            const p1Text = await scanImage(p1Img, "Extract all text on this page exactly, especially section 3 'मतदान स्थल का विवरण', section 1 'भागों की संख्या व नाम' or 'अनुभाग संख्या और नाम', polling station details, and village name.");
            console.log(p1Text);
            fs.unlinkSync(p1Img);
        }

        if (fs.existsSync(p2Img)) {
            console.log(`--- Page 2 OCR (Header Section Details) ---`);
            const p2Text = await scanImage(p2Img, "Extract the top header area text, especially 'अनुभाग संख्या और नाम' (Section number and name) and voter details.");
            console.log(p2Text.substring(0, 1000));
            fs.unlinkSync(p2Img);
        }

        if (fs.existsSync(p3Img)) {
            fs.unlinkSync(p3Img);
        }
    }
}

main().catch(console.error);
