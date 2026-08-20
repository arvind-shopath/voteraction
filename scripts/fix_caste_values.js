const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VALID_CASTES = new Set([
    'ब्राह्मण', 'राजपूत/ठाकुर', 'वैश्य/गुप्ता', 'वैश्य/अग्रवाल', 'वैश्य/रस्तोगी',
    'यादव', 'मौर्य/कुशवाहा', 'सैनी/मौर्य', 'कुर्मी/पटेल', 'कुर्मी/वर्मा',
    'जाट', 'गुर्जर', 'विश्वकर्मा', 'प्रजापति/कुम्हार', 'साहू/तेली', 'साहू/शाह',
    'गोस्वामी/गिरी', 'पासवान', 'जाटव/राम', 'पासी', 'जाटव', 'रविदास/जाटव',
    'वाल्मीकि', 'गौतम/जाटव', 'सोनकर/खटीक', 'कोरी', 'मीणा', 'गोंड',
    'मुस्लिम समुदाय', 'बिंद', 'राजभर', 'निषाद', 'चौहान', 'पाल/गड़ेरिया', 'अन्य / अज्ञात'
]);

const CASTE_CLEAN_MAP = {
    'shukla': 'ब्राह्मण', 'शुक्ला': 'ब्राह्मण',
    'sharma': 'ब्राह्मण', 'शर्मा': 'ब्राह्मण',
    'mishra': 'ब्राह्मण', 'मिश्रा': 'ब्राह्मण',
    'pandey': 'ब्राह्मण', 'पांडेय': 'ब्राह्मण',
    'dwivedi': 'ब्राह्मण', 'द्विवेदी': 'ब्राह्मण',
    'dubey': 'ब्राह्मण', 'दूबे': 'ब्राह्मण',
    'tiwari': 'ब्राह्मण', 'तिवारी': 'ब्राह्मण',
    'pathak': 'ब्राह्मण', 'पाठक': 'ब्राह्मण',
    'singh': 'राजपूत/ठाकुर', 'सिंह': 'राजपूत/ठाकुर',
    'rajput': 'राजपूत/ठाकुर', 'राजपूत': 'राजपूत/ठाकुर',
    'thakur': 'राजपूत/ठाकुर', 'ठाकुर': 'राजपूत/ठाकुर',
    'chauhan': 'चौहान', 'चौहान': 'चौहान',
    'gupta': 'वैश्य/गुप्ता', 'गुप्ता': 'वैश्य/गुप्ता', 'गुप्त': 'वैश्य/गुप्ता',
    'yadav': 'यादव', 'यादव': 'यादव', 'याद': 'यादव', 'अहीर': 'यादव',
    'maurya': 'मौर्य/कुशवाहा', 'मौर्य': 'मौर्य/कुशवाहा', 'कुशवाहा': 'मौर्य/कुशवाहा',
    'verma': 'कुर्मी/वर्मा', 'वर्मा': 'कुर्मी/वर्मा', 'kurmi': 'कुर्मी/पटेल', 'कुर्मी': 'कुर्मी/पटेल', 'पटेल': 'कुर्मी/पटेल',
    'bind': 'बिंद', 'बिन्द': 'बिंद', 'Bind': 'बिंद',
    'rajbhar': 'राजभर', 'राजभर': 'राजभर', 'Rajabhar': 'राजभर', 'Rajbhar': 'राजभर',
    'paswan': 'पासवान', 'पासवान': 'पासवान',
    'pasi': 'पासी', 'पासी': 'पासी',
    'jatav': 'जाटव', 'जाटव': 'जाटव',
    'sonkar': 'सोनकर/खटीक', 'सोनकर': 'सोनकर/खटीक',
    'vishwakarma': 'विश्वकर्मा', 'विश्वकर्मा': 'विश्वकर्मा',
    'prajapati': 'प्रजापति/कुम्हार', 'प्रजापति': 'प्रजापति/कुम्हार'
};

async function main() {
    console.log("=== FAST BATCH FIXING CASTE VALUES ===");

    // 1. First map known variations using updateMany
    for (const [key, targetCaste] of Object.entries(CASTE_CLEAN_MAP)) {
        await prisma.voter.updateMany({
            where: { caste: key },
            data: { caste: targetCaste }
        });
    }

    // 2. Set all invalid castes (not in VALID_CASTES) to "अन्य / अज्ञात"
    const validArray = Array.from(VALID_CASTES);
    const res = await prisma.voter.updateMany({
        where: {
            caste: { notIn: validArray }
        },
        data: { caste: 'अन्य / अज्ञात' }
    });

    console.log(`Reset ${res.count} invalid caste entries to "अन्य / अज्ञात".`);

    // 3. Muslim voters clean up
    await prisma.voter.updateMany({
        where: { religion: 'मुस्लिम', caste: 'अन्य / अज्ञात' },
        data: { caste: 'मुस्लिम समुदाय' }
    });

    const distinctCastes = await prisma.voter.groupBy({
        by: ['caste'],
        _count: { id: true }
    });

    console.log(`\n✅ NEW CLEAN DISTINCT CASTES COUNT: ${distinctCastes.length}`);
    console.log("DISTINCT CASTES SUMMARY:");
    distinctCastes.forEach(c => console.log(`- Caste: "${c.caste}" | Voters: ${c._count.id}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
