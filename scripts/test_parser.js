const fs = require('fs');

async function main() {
    try {
        const text = fs.readFileSync('/var/www/voteraction/test_output.txt', 'utf-8');
        console.log('--- Raw Text Start ---');
        console.log(text.substring(0, 500) + '...');
        console.log('--- Raw Text End ---');

        const voters = parseUPVoterRoll(text);
        console.log(JSON.stringify(voters, null, 2));
    } catch (e) {
        console.error(e);
    }
}

function parseUPVoterRoll(text) {
    const voters = [];
    const pages = text.split('\f'); // Tesseract output might not have \f, implies single page

    let mainVillage = 'Unknown';
    let commonAddress = 'Unknown';

    // Regex to capture global info from Page 1 or headers
    const villageRegex = /भाग\s+में\s+अनुभागों\s+की\s+संख्या\s+और\s+नाम\s*[:\-\n]+\s*(\d+\s*-\s*[^\n]+)/i;
    const panchayatRegex = /पंचायत\s*[:\s-]+\s*([^\s][^\n:]+)/i;
    // ... (other regexes skipped for brevity as they apply to cover page mostly)

    // Process Pages
    for (const pageText of pages) {
        // Basic check for data page
        // Relaxed regex for testing just in case OCR missed some parts of EPIC
        // if (!pageText.match(/[A-Z]{2,}/) && !pageText.match(/\d{7}/)) continue; 

        const lines = pageText.split('\n');
        const columnBuckets = { 0: [], 1: [], 2: [] };

        lines.forEach(line => {
            // Strategy: Split line by wide gap (2 spaces) OR pipe character which OCR often picks up from grid lines
            const parts = line.split(/\||\s{2,}/).filter(p => p.trim().length > 1); // Filter very short noise

            if (parts.length > 0) {
                // Simple bucketing: 1 part -> try to guess col, 2 parts -> left/right, 3 parts -> full
                if (parts.length === 3) {
                    columnBuckets[0].push(parts[0]);
                    columnBuckets[1].push(parts[1]);
                    columnBuckets[2].push(parts[2]);
                } else {
                    // Fallback to index-based bucketing
                    let searchStartIndex = 0;
                    parts.forEach(part => {
                        const index = line.indexOf(part, searchStartIndex);
                        // Advance but be careful if part appears multiple times (unlikely in single line context)
                        // But since we split by regex, finding exact index by string match is safe enough for this
                        searchStartIndex = index + part.length;

                        let colIndex = 0;
                        // Tesseract might yield different indices than pdftotext
                        // Let's print index to debug if needed
                        if (index < 40) colIndex = 0;
                        else if (index < 90) colIndex = 1;
                        else colIndex = 2;

                        columnBuckets[colIndex].push(part);
                    });
                }
            }
        });

        // Process buckets
        [0, 1, 2].forEach(colIdx => {
            const colLines = columnBuckets[colIdx];
            let currentBlock = [];

            colLines.forEach(line => {
                // Permissive Regex for noisy EPICs
                // Catch standard (UP/85...) or New (XEO...)
                // Allow > or ) characters which OCR sometimes mistakes for first letter
                const epicRegex = /([A-Z0-9>]{2,}[\/\\]?[\dO]+[\/\\]?[\dO]+[\/\\]?[\dO]+|[A-Z0-9>]{3}[\dO]{6,7})/;
                const hasEpic = line.match(epicRegex);

                // Also trigger new block on "Name :" or "E :" or "Photo" if EPIC missed? 
                // For now stick to EPIC as primary separator
                if (hasEpic) {
                    if (currentBlock.length > 0) {
                        // Process previous block
                        const blockText = currentBlock.join('\n');
                        const extracted = extractVoterFromBlock(blockText, mainVillage, commonAddress);
                        if (extracted) voters.push(extracted);
                    }
                    currentBlock = [line];
                } else {
                    if (currentBlock.length > 0) {
                        currentBlock.push(line);
                    }
                }
            });
            // Flush last block
            if (currentBlock.length > 0) {
                const blockText = currentBlock.join('\n');
                const extracted = extractVoterFromBlock(blockText, mainVillage, commonAddress);
                if (extracted) voters.push(extracted);
            }
        });
    }
    return voters;
}

function extractVoterFromBlock(textBlock, defaultVillage, defaultAddress) {
    // Permissive EPIC extraction
    const allEpics = [...textBlock.matchAll(/([A-Z0-9>]{2,}[\/\\]?[\dO]+[\/\\]?[\dO]+[\/\\]?[\dO]+|[A-Z0-9>]{3}[\dO]{6,7})/g)];
    if (allEpics.length === 0) return null;

    let epic = allEpics[0][1];
    // Attempt to clean EPIC
    epic = epic.replace(/^>/, 'X').replace(/^3&/, 'XE').replace(/O/g, '0'); // Basic corrections attempt

    // Name - relax "Name" keyword requirement if not found, usually 2nd line if 1st is EPIC?
    // But let's stick to keyword matching for safety
    const nameMatch = textBlock.match(/(?:Name|नाम|नभ)\s*[:\s\-\.]+\s*([^\n\r]+)/i);
    let name = nameMatch ? nameMatch[1].trim() : '';
    // Cleanup name: remove trailing keywords
    name = name.split(/(?:Gender|लिंग|Husband|Father|Mother|पिता|पति)/i)[0].trim();

    // Relation
    const relMatch = textBlock.match(/(?:Father|Husband|Mother|पिता|पति|माता)(?:\s+का\s+नाम)?\s*[:\s\-\.]+\s*([^\n\r]+)/i);
    let relativeName = relMatch ? relMatch[1].trim() : '';
    relativeName = relativeName.split(/(?:Makan|House|Gender|लिंग)/i)[0].trim();

    let relationType = 'Father';
    if (textBlock.match(/(?:Husband|पति)/i)) relationType = 'Husband';
    else if (textBlock.match(/(?:Mother|माता)/i)) relationType = 'Mother';

    // House No
    const houseMatch = textBlock.match(/(?:House|Makan|Grih)\s*(?:No|Sankhya|संख्या)?\s*[:\s\-\.]+\s*([\w\d\/-]+)/i);
    const houseNumber = houseMatch ? houseMatch[1].trim() : '';

    // Age
    const ageMatch = textBlock.match(/(?:Age|आयु)\s*[:\s\-\.]+\s*(\d+)/i);
    const age = ageMatch ? parseInt(ageMatch[1]) : 0;

    // Gender
    const genderMatch = textBlock.match(/(?:Gender|लिंग)\s*[:\s\-\.]+\s*([\w\u0900-\u097F]+)/i);
    let gender = 'M';
    if (genderMatch) {
        const gText = genderMatch[1].toLowerCase();
        if (gText.includes('mahila') || gText.includes('महिला') || gText.includes('f')) gender = 'F';
    }
    if (relationType === 'Husband') gender = 'F';

    return {
        epic,
        name,
        relativeName,
        relationType,
        age,
        gender,
        houseNumber,
        village: defaultVillage,
        area: defaultAddress,
        originalText: textBlock.replace(/\n/g, ' | ')
    };
}

main();
