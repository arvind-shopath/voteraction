const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Correct the spelling in ElectionHistory to match Party table
    const result = await prisma.electionHistory.updateMany({
        where: { partyName: 'निर्द्लीय (Independent)' },
        data: { partyName: 'निर्दलीय (Independent)' }
    });

    console.log(`Updated ${result.count} records in ElectionHistory.`);
}

main().catch(console.error);
