const fs = require('fs');

const content = fs.readFileSync('src/app/(app)/social/page.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
let rootFound = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Simple regex for tags. Note: This is a rough approximation.
    // We care mostly about divs and expressions.
    const openDivs = (line.match(/<div/g) || []).length;
    const closeDivs = (line.match(/<\/div>/g) || []).length;
    const openBrace = (line.match(/{/g) || []).length;
    const closeBrace = (line.match(/}/g) || []).length;
    const openParen = (line.match(/\(/g) || []).length;
    const closeParen = (line.match(/\)/g) || []).length;

    // Check strict tag matching line by line (simplified)
    if (trimmed.startsWith('<div') && !trimmed.includes('/>')) {
        stack.push({ tag: 'div', line: i + 1 });
    }
    // Handle closing div
    if (trimmed.includes('</div>')) {
        // Count how many closes. Usually line has one.
        for (let c = 0; c < closeDivs; c++) {
            const last = stack.pop();
            if (!last || last.tag !== 'div') {
                console.log(`Line ${i + 1}: UNEXPECTED </div>. Stack top: ${last ? last.tag : 'EMPTY'}`);
            } else {
                // console.log(`Line ${i+1}: Closed div from ${last.line}`);
            }
        }
    }

    // Handle start of component
    if (line.includes('return (')) {
        console.log(`Line ${i + 1}: Return Start`);
        rootFound = true;
        // reset stack if needed, but we assume file scope
        stack = [];
    }
}

console.log('Final Stack:', stack);
