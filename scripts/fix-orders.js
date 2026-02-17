const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Fix spelling of Independent if needed
    await prisma.party.updateMany({
        where: { name: 'निर्द्लीय (Independent)' },
        data: { name: 'निर्दलीय (Independent)' }
    });

    // 2. Set Sort Orders
    const orders = [
        { name: 'भाजपा (BJP)', order: 1 },
        { name: 'कांग्रेस (Congress)', order: 2 },
        { name: 'सपा (SP)', order: 3 },
        { name: 'बसपा (BSP)', order: 4 },
        { name: 'RLD', order: 5 },
        { name: 'JDU (जनता दल - यूनाइटेड)', order: 6 },
        { name: 'RJD (राष्ट्रीय जनता दल)', order: 7 },
        { name: 'LJP - रामविलास', order: 8 },
        { name: 'HAM (हिंदुस्तानी अवाम मोर्चा)', order: 9 },
        { name: 'RLM (राष्ट्रीय लोक मोर्चा)', order: 10 },
        { name: 'जनसुराज (Jan Suraaj)', order: 11 },
        { name: 'अन्य', order: 12 },
        { name: 'निर्दलीय (Independent)', order: 13 }
    ];

    for (const o of orders) {
        await prisma.party.updateMany({
            where: { name: o.name },
            data: { sortOrder: o.order }
        });
    }

    console.log('Sort orders updated successfully.');
}

main().catch(console.error);
