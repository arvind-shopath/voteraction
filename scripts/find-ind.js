const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const p = await prisma.party.findMany({
        where: { name: { contains: 'Independent' } }
    });
    console.log(JSON.stringify(p, null, 2));
}

main().catch(console.error);
