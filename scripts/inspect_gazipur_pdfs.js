const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
    const gazipurDir = 'C:\\Users\\creatiAV\\Documents\\voteraction\\gazipur';
    const bundledPdftotext = path.join(process.cwd(), 'node_modules', 'pdf-poppler', 'lib', 'win', 'poppler-0.51', 'bin', 'pdftotext.exe');

    // Inspect Booth 8 and Booth 7
    const filesToTest = [
        '2026-EROLLGEN-S24-375-SIR-DraftRoll-Revision1-HIN-7-WI.pdf',
        '2026-EROLLGEN-S24-375-SIR-DraftRoll-Revision1-HIN-8-WI.pdf'
    ];

    for (const f of filesToTest) {
        const pdfPath = path.join(gazipurDir, f);
        const txtPath = pdfPath + '.txt';

        try {
            console.log(`\n==================================================`);
            console.log(`EXTRACTING TEXT FOR: ${f}`);
            execSync(`"${bundledPdftotext}" -f 1 -l 4 -layout -enc UTF-8 "${pdfPath}" "${txtPath}"`);
            if (fs.existsSync(txtPath)) {
                const text = fs.readFileSync(txtPath, 'utf-8');
                fs.unlinkSync(txtPath);

                console.log(`Length of extracted text: ${text.length} chars`);
                console.log("--- FIRST 2000 CHARS OF PDF ---");
                console.log(text.substring(0, 2000));
            }
        } catch (e) {
            console.error(`Error processing ${f}:`, e.message);
        }
    }
}

main();
