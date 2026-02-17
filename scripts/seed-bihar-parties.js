
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const biharParties = [
        { name: 'RJD (राष्ट्रीय जनता दल)', color: '#008000', logo: 'https://cdn-icons-png.flaticon.com/512/10708/10708514.png' }, // Green (Lantern)
        { name: 'JDU (जनता दल - यूनाइटेड)', color: '#006400', logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }, // Dark Green (Arrow)
        { name: 'LJP - रामविलास', color: '#00BFFF', logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }, // Sky Blue (Helicopter)
        { name: 'HAM (हिंदुस्तानी अवाम मोर्चा)', color: '#FFD700', logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }, // Yellow (Wok/Pan)
        { name: 'RLM (राष्ट्रीय लोक मोर्चा)', color: '#444444', logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }, // Grey/Green (Ceiling Fan)
        { name: 'जनसुराज (Jan Suraaj)', color: '#FFA500', logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' } // Orange/Yellow
    ];

    console.log('Adding Bihar parties to database...');

    for (const party of biharParties) {
        // Upsert based on name to avoid duplicates
        const existing = await prisma.party.findFirst({ where: { name: party.name } });
        if (!existing) {
            await prisma.party.create({ data: party });
            console.log(`Added: ${party.name}`);
        } else {
            console.log(`Skipped (already exists): ${party.name}`);
        }
    }

    console.log('✅ Done!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
