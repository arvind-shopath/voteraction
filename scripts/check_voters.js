const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const voters = await prisma.voter.findMany({
        take: 10,
        orderBy: { id: 'desc' }
    });
    console.log(JSON.stringify(voters, null, 2));
    await prisma.$disconnect();
}

main();
