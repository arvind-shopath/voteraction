
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const upParties = ["सपा (SP)", "बसपा (BSP)", "RLD"];
    const biharParties = [
        "JDU (जनता दल - यूनाइटेड)",
        "RJD (राष्ट्रीय जनता दल)",
        "LJP - रामविलास",
        "HAM (हिंदुस्तानी अवाम मोर्चा)",
        "RLM (राष्ट्रीय लोक मोर्चा)",
        "जनसुराज (Jan Suraaj)"
    ];

    console.log('Updating party states...');

    // Default is National, so we only need to update specific ones
    for (const name of upParties) {
        await prisma.party.updateMany({
            where: { name: { contains: name.split(' ')[0] } },
            data: { state: "Uttar Pradesh" }
        });
        console.log(`Updated to UP: ${name}`);
    }

    for (const name of biharParties) {
        await prisma.party.updateMany({
            where: { name: { contains: name.split(' ')[0] } },
            data: { state: "Bihar" }
        });
        console.log(`Updated to Bihar: ${name}`);
    }

    console.log('✅ Party states updated!');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
