const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanBooths() {
    console.log('Cleaning up booth names...');
    const result = await prisma.booth.updateMany({
        data: {
            name: null
        }
    });
    console.log(`Successfully cleared names for ${result.count} booths.`);
}

cleanBooths()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
