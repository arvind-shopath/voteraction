
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncAllFamilies() {
    console.log("Starting global family size sync (with Area check)...");

    // Get all unique houses (village + area + houseNumber)
    const houses = await prisma.voter.findMany({
        select: { village: true, area: true, houseNumber: true },
        distinct: ['village', 'area', 'houseNumber'],
        where: { houseNumber: { not: '' } }
    });

    console.log(`Found ${houses.length} unique houses. Updating counts...`);

    let processed = 0;
    for (const house of houses) {
        const count = await prisma.voter.count({
            where: {
                village: house.village,
                area: house.area,
                houseNumber: house.houseNumber
            }
        });

        await prisma.voter.updateMany({
            where: {
                village: house.village,
                area: house.area,
                houseNumber: house.houseNumber
            },
            data: { familySize: count }
        });
        processed++;
        if (processed % 100 === 0) console.log(`Processed ${processed}/${houses.length} houses...`);
    }

    console.log("Global sync finished.");
}

syncAllFamilies()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
