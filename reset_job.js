
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.importJob.update({
        where: { id: 12 },
        data: { status: 'PENDING', progress: 0 }
    });
    console.log('Reset Job #12 to PENDING');
}

main().catch(console.error).finally(() => prisma.$disconnect());
