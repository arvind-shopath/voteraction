
import { extractTextFromPdf, parseUPVoterRoll } from '../lib/pdf-parser';
import { join } from 'path';

const file = join(process.cwd(), 'pdf data/2026-EROLLGEN-S24-148-SIR-DraftRoll-Revision1-HIN-3-WI.pdf');

async function run() {
    console.log('Testing extraction on:', file);
    try {
        const text = await extractTextFromPdf(file);
        console.log('Extracted Length:', text.length);

        const voters = parseUPVoterRoll(text);
        console.log('Parsed Voters:', voters.length);

        if (voters.length > 0) {
            console.log('Last Voter:', voters[voters.length - 1]);
        }

    } catch (e) {
        console.error('Error:', e);
    }
}
run();
