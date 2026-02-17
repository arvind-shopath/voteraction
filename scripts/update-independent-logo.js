
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Get Jan Suraaj logo
    const janSuraaj = await prisma.party.findFirst({
        where: { name: { contains: 'जनसुराज' } }
    });

    if (!janSuraaj) {
        console.error('Jan Suraaj party not found!');
        return;
    }

    console.log(`Found Jan Suraaj logo: ${janSuraaj.logo}`);

    // 2. Update Independent logo
    // Using contains to be safe with exact spelling/encoding
    const result = await prisma.party.updateMany({
        where: { name: { contains: 'Independent' } },
        data: { logo: janSuraaj.logo }
    });

    if (result.count > 0) {
        console.log(`Successfully updated ${result.count} party (Independent) with Jan Suraaj logo.`);
    } else {
        console.log('Independent party not found to update.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
