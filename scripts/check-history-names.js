const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const history = await prisma.electionHistory.findMany({
        select: { partyName: true },
        distinct: ['partyName']
    });
    console.log('Unique Party Names in ElectionHistory:');
    console.log(JSON.stringify(history, null, 2));
}

main().catch(console.error);
