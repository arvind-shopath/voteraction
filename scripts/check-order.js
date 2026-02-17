const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const parties = await prisma.party.findMany({
        select: { id: true, name: true, sortOrder: true }
    });
    console.log(JSON.stringify(parties, null, 2));
}

main().catch(console.error);
