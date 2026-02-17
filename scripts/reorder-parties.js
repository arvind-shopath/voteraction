
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const sequence = [
        "भाजपा (BJP)",
        "कांग्रेस (Congress)",
        "सपा (SP)",
        "बसपा (BSP)",
        "RLD",
        "JDU (जनता दल - यूनाइटेड)",
        "RJD (राष्ट्रीय जनता दल)",
        "LJP - रामविलास",
        "HAM (हिंदुस्तानी अवाम मोर्चा)",
        "RLM (राष्ट्रीय लोक मोर्चा)",
        "जनसुराज (Jan Suraaj)",
        "निर्द्लीय (Independent)"
    ];

    console.log('Updating party sequence...');

    for (let i = 0; i < sequence.length; i++) {
        const partyName = sequence[i];
        const res = await prisma.party.updateMany({
            where: { name: { contains: partyName.split(' ')[0] } }, // Using contains and the first part of name for better matching
            data: { sortOrder: i + 1 }
        });

        if (res.count > 0) {
            console.log(`Updated: ${partyName} with order ${i + 1}`);
        } else {
            // Try exact match if contains failed or was ambiguous
            const resExact = await prisma.party.updateMany({
                where: { name: partyName },
                data: { sortOrder: i + 1 }
            });
            if (resExact.count > 0) {
                console.log(`Updated (Exact): ${partyName} with order ${i + 1}`);
            } else {
                console.log(`Failed to find party: ${partyName}`);
            }
        }
    }

    // Set a high sort order for any others just in case
    await prisma.party.updateMany({
        where: { sortOrder: 0 },
        data: { sortOrder: 99 }
    });

    console.log('✅ Sequence update complete!');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
