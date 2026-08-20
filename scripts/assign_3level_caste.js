const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SURNAME_MAP = {
    // General - Brahmin
    'शुक्ला': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'शुक्ला' },
    'shukla': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'शुक्ला' },
    'शर्मा': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'शर्मा' },
    'sharma': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'शर्मा' },
    'मिश्रा': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'मिश्रा' },
    'mishra': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'मिश्रा' },
    'पांडेय': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'पांडेय' },
    'pandey': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'पांडेय' },
    'तिवारी': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'तिवारी' },
    'tiwari': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'तिवारी' },
    'दूबे': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'दूबे' },
    'dubey': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'दूबे' },
    'द्विवेदी': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'द्विवेदी' },
    'dwivedi': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'द्विवेदी' },
    'पाठक': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'पाठक' },
    'pathak': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'पाठक' },
    'उपाध्याय': { category: 'सामान्य', caste: 'ब्राह्मण', subCaste: 'उपाध्याय' },

    // General - Kayasth / Lala
    'सक्सेना': { category: 'सामान्य', caste: 'कायस्थ/लाला', subCaste: 'सक्सेना' },
    'saxena': { category: 'सामान्य', caste: 'कायस्थ/लाला', subCaste: 'सक्सेना' },
    'श्रीवास्तव': { category: 'सामान्य', caste: 'कायस्थ/लाला', subCaste: 'श्रीवास्तव' },
    'srivastava': { category: 'सामान्य', caste: 'कायस्थ/लाला', subCaste: 'श्रीवास्तव' },
    'निगम': { category: 'सामान्य', caste: 'कायस्थ/लाला', subCaste: 'निगम' },
    'nigam': { category: 'सामान्य', caste: 'कायस्थ/लाला', subCaste: 'निगम' },
    'सिन्हा': { category: 'सामान्य', caste: 'कायस्थ/लाला', subCaste: 'सिन्हा' },
    'sinha': { category: 'सामान्य', caste: 'कायस्थ/लाला', subCaste: 'सिन्हा' },
    'माथुर': { category: 'सामान्य', caste: 'कायस्थ/लाला', subCaste: 'माथुर' },

    // General - Rajput / Thakur
    'सिंह': { category: 'सामान्य', caste: 'राजपूत/ठाकुर', subCaste: 'सिंह' },
    'singh': { category: 'सामान्य', caste: 'राजपूत/ठाकुर', subCaste: 'सिंह' },
    'राजपूत': { category: 'सामान्य', caste: 'राजपूत/ठाकुर', subCaste: 'राजपूत' },
    'ठाकुर': { category: 'सामान्य', caste: 'राजपूत/ठाकुर', subCaste: 'ठाकुर' },
    'चौहान': { category: 'सामान्य', caste: 'राजपूत/ठाकुर', subCaste: 'चौहान' },
    'chauhan': { category: 'सामान्य', caste: 'राजपूत/ठाकुर', subCaste: 'चौहान' },
    'राठौड़': { category: 'सामान्य', caste: 'राजपूत/ठाकुर', subCaste: 'राठौड़' },

    // General - Vaishya / Gupta
    'गुप्ता': { category: 'सामान्य', caste: 'वैश्य/गुप्ता', subCaste: 'गुप्ता' },
    'gupta': { category: 'सामान्य', caste: 'वैश्य/गुप्ता', subCaste: 'गुप्ता' },
    'अग्रवाल': { category: 'सामान्य', caste: 'वैश्य/अग्रवाल', subCaste: 'अग्रवाल' },
    'agarwal': { category: 'सामान्य', caste: 'वैश्य/अग्रवाल', subCaste: 'अग्रवाल' },
    'रस्तोगी': { category: 'सामान्य', caste: 'वैश्य/रस्तोगी', subCaste: 'रस्तोगी' },

    // OBC
    'यादव': { category: 'ओबीसी', caste: 'यादव', subCaste: 'यादव' },
    'yadav': { category: 'ओबीसी', caste: 'यादव', subCaste: 'यादव' },
    'मौर्य': { category: 'ओबीसी', caste: 'मौर्य/कुशवाहा', subCaste: 'मौर्य' },
    'maurya': { category: 'ओबीसी', caste: 'मौर्य/कुशवाहा', subCaste: 'मौर्य' },
    'कुशवाहा': { category: 'ओबीसी', caste: 'मौर्य/कुशवाहा', subCaste: 'कुशवाहा' },
    'कुर्मी': { category: 'ओबीसी', caste: 'कुर्मी/पटेल', subCaste: 'कुर्मी' },
    'पटेल': { category: 'ओबीसी', caste: 'कुर्मी/पटेल', subCaste: 'पटेल' },
    'वर्मा': { category: 'ओबीसी', caste: 'कुर्मी/वर्मा', subCaste: 'वर्मा' },
    'verma': { category: 'ओबीसी', caste: 'कुर्मी/वर्मा', subCaste: 'वर्मा' },
    'बिंद': { category: 'ओबीसी', caste: 'बिंद', subCaste: 'बिंद' },
    'bind': { category: 'ओबीसी', caste: 'बिंद', subCaste: 'बिंद' },
    'राजभर': { category: 'ओबीसी', caste: 'राजभर', subCaste: 'राजभर' },
    'rajbhar': { category: 'ओबीसी', caste: 'राजभर', subCaste: 'राजभर' },
    'विश्वकर्मा': { category: 'ओबीसी', caste: 'विश्वकर्मा', subCaste: 'विश्वकर्मा' },
    'प्रजापति': { category: 'ओबीसी', caste: 'प्रजापति/कुम्हार', subCaste: 'प्रजापति' },

    // SC
    'पासवान': { category: 'एससी', caste: 'पासवान', subCaste: 'पासवान' },
    'paswan': { category: 'एससी', caste: 'पासवान', subCaste: 'पासवान' },
    'जाटव': { category: 'एससी', caste: 'जाटव', subCaste: 'जाटव' },
    'jatav': { category: 'एससी', caste: 'जाटव', subCaste: 'जाटव' },
    'पासी': { category: 'एससी', caste: 'पासी', subCaste: 'पासी' },
    'गौतम': { category: 'एससी', caste: 'गौतम/जाटव', subCaste: 'गौतम' },

    // ST
    'मीणा': { category: 'एसटी', caste: 'मीणा', subCaste: 'मीणा' }
};

async function main() {
    console.log("=== FAST BATCH ENHANCING 3-LEVEL CASTE HIERARCHY ===");

    // 1. Batch update mapped surnames
    for (const [key, mapping] of Object.entries(SURNAME_MAP)) {
        await prisma.voter.updateMany({
            where: {
                OR: [
                    { surname: key },
                    { surname: key.toLowerCase() },
                    { name: { contains: key } },
                    { relativeName: { contains: key } }
                ]
            },
            data: {
                casteCategory: mapping.category,
                caste: mapping.caste,
                subCaste: mapping.subCaste
            }
        });
    }

    // 2. Clear invalid "अन्य / अज्ञात" from caste column and move "अज्ञात" to casteCategory!
    await prisma.voter.updateMany({
        where: { caste: "अन्य / अज्ञात" },
        data: { caste: null, subCaste: null, casteCategory: "अज्ञात" }
    });

    // 3. Any voter with null casteCategory gets "अज्ञात"
    await prisma.voter.updateMany({
        where: { casteCategory: null },
        data: { casteCategory: "अज्ञात" }
    });

    // 4. Muslim voters check
    await prisma.voter.updateMany({
        where: { religion: "मुस्लिम" },
        data: { casteCategory: "मुस्लिम", caste: "मुस्लिम समुदाय" }
    });

    const levelStats = await Promise.all([
        prisma.voter.groupBy({ by: ['casteCategory'], _count: true }),
        prisma.voter.groupBy({ by: ['casteCategory', 'caste'], _count: true }),
        prisma.voter.groupBy({ by: ['casteCategory', 'caste', 'subCaste'], _count: true })
    ]);

    console.log("\n✅ LEVEL 1 (वर्ग) DISTRIBUTION:");
    levelStats[0].forEach(g => console.log(`- Category: "${g.casteCategory}" | Voters: ${g._count}`));

    console.log("\n✅ LEVEL 2 (जाति) DISTRIBUTION:");
    levelStats[1].filter(g => g.caste !== null).slice(0, 15).forEach(g => console.log(`- ${g.casteCategory} -> Caste: "${g.caste}" | Voters: ${g._count}`));

    console.log("\n✅ LEVEL 3 (उपजाति / उपनाम) DISTRIBUTION:");
    levelStats[2].filter(g => g.subCaste !== null).slice(0, 15).forEach(g => console.log(`- ${g.casteCategory} -> ${g.caste} -> SubCaste: "${g.subCaste}" | Voters: ${g._count}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
