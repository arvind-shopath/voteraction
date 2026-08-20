const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORY_MAP = {
    'General': ['ब्राह्मण', 'राजपूत/ठाकुर', 'वैश्य/गुप्ता', 'वैश्य/अग्रवाल', 'वैश्य/रस्तोगी'],
    'OBC': ['यादव', 'बिंद', 'राजभर', 'मौर्य/कुशवाहा', 'सैनी/मौर्य', 'कुर्मी/पटेल', 'कुर्मी/वर्मा', 'जाट', 'गुर्जर', 'विश्वकर्मा', 'प्रजापति/कुम्हार', 'साहू/तेली', 'साहू/शाह', 'गोस्वामी/गिरी', 'पाल/गड़ेरिया', 'निषाद', 'चौहान'],
    'SC': ['पासवान', 'जाटव/राम', 'पासी', 'जाटव', 'रविदास/जाटव', 'वाल्मीकि', 'गौतम/जाटव', 'सोनकर/खटीक', 'कोरी'],
    'ST': ['मीणा', 'गोंड'],
    'Muslim': ['मुस्लिम समुदाय']
};

async function main() {
    console.log("=== ASSIGNING CASTE CATEGORIES IN DB ===");

    for (const casteName of CATEGORY_MAP.General) {
        await prisma.voter.updateMany({
            where: { caste: casteName },
            data: { casteCategory: 'सामान्य' }
        });
    }

    for (const casteName of CATEGORY_MAP.OBC) {
        await prisma.voter.updateMany({
            where: { caste: casteName },
            data: { casteCategory: 'ओबीसी' }
        });
    }

    for (const casteName of CATEGORY_MAP.SC) {
        await prisma.voter.updateMany({
            where: { caste: casteName },
            data: { casteCategory: 'एससी' }
        });
    }

    for (const casteName of CATEGORY_MAP.ST) {
        await prisma.voter.updateMany({
            where: { caste: casteName },
            data: { casteCategory: 'एसटी' }
        });
    }

    for (const casteName of CATEGORY_MAP.Muslim) {
        await prisma.voter.updateMany({
            where: { OR: [{ caste: casteName }, { religion: 'मुस्लिम' }] },
            data: { casteCategory: 'मुस्लिम' }
        });
    }

    // Default remaining to "सामान्य"
    await prisma.voter.updateMany({
        where: { casteCategory: null },
        data: { casteCategory: 'सामान्य' }
    });

    const categoryGroups = await prisma.voter.groupBy({
        by: ['casteCategory'],
        _count: { id: true }
    });

    console.log("\n✅ CATEGORY DISTRIBUTION IN DB:");
    categoryGroups.forEach(g => console.log(`- Category: "${g.casteCategory}" | Voters: ${g._count.id}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
