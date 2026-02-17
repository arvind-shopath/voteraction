const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const parties = await prisma.party.findMany({
        select: { name: true, logo: true }
    });
    console.log(JSON.stringify(parties, null, 2));
}

main().catch(console.error);
