const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Hindu name indicators to protect from incorrect Muslim classification
const HINDU_NAME_INDICATORS = [
    'राम', 'रमेश', 'सुरेश', 'महेश', 'दिनेश', 'राजेश', 'राकेश', 'कमलेश', 'मुकेश',
    'संदीप', 'प्रदीप', 'कुलदीप', 'अभिषेक', 'अमित', 'विकास', 'संजय', 'अजय', 'विजय',
    'कालिका', 'हरि', 'देव', 'कृष्ण', 'शिव', 'ओम', 'विष्णु', 'गणेश', 'हनुमान',
    'पूजा', 'निर्मला', 'उर्मिला', 'सुनीता', 'अनीता', 'संगीता', 'रीता', 'गीता', 'शीला',
    'शुक्ला', 'शर्मा', 'मिश्रा', 'पांडेय', 'तिवारी', 'दूबे', 'द्विवेदी', 'पाठक',
    'सक्सेना', 'श्रीवास्तव', 'निगम', 'सिन्हा', 'सिंह', 'ठाकुर', 'चौहान',
    'गुप्ता', 'अग्रवाल', 'रस्तोगी', 'वर्मा', 'पटेल', 'गौतम', 'यादव', 'बिंद',
    'राजभर', 'मौर्य', 'कुशवाहा', 'प्रजापति', 'कुम्हार', 'पासवान', 'जाटव', 'मीणा', 'विश्वकर्मा'
];

// Standard surname to Caste, SubCaste, Category, Religion mappings
const SURNAME_MAP = {
    'प्रजापति': { caste: 'प्रजापति/कुम्हार', subCaste: 'प्रजापति/कुम्हार', category: 'ओबीसी', religion: 'हिंदू' },
    'कुम्हार': { caste: 'प्रजापति/कुम्हार', subCaste: 'प्रजापति/कुम्हार', category: 'ओबीसी', religion: 'हिंदू' },
    'शुक्ला': { caste: 'ब्राह्मण', subCaste: 'शुक्ला', category: 'सामान्य', religion: 'हिंदू' },
    'शर्मा': { caste: 'ब्राह्मण', subCaste: 'शर्मा', category: 'सामान्य', religion: 'हिंदू' },
    'मिश्रा': { caste: 'ब्राह्मण', subCaste: 'मिश्रा', category: 'सामान्य', religion: 'हिंदू' },
    'पांडेय': { caste: 'ब्राह्मण', subCaste: 'पांडेय', category: 'सामान्य', religion: 'हिंदू' },
    'तिवारी': { caste: 'ब्राह्मण', subCaste: 'तिवारी', category: 'सामान्य', religion: 'हिंदू' },
    'दूबे': { caste: 'ब्राह्मण', subCaste: 'दूबे', category: 'सामान्य', religion: 'हिंदू' },
    'द्विवेदी': { caste: 'ब्राह्मण', subCaste: 'द्विवेदी', category: 'सामान्य', religion: 'हिंदू' },
    'सक्सेना': { caste: 'कायस्थ/लाला', subCaste: 'सक्सेना', category: 'सामान्य', religion: 'हिंदू' },
    'श्रीवास्तव': { caste: 'कायस्थ/लाला', subCaste: 'श्रीवास्तव', category: 'सामान्य', religion: 'हिंदू' },
    'निगम': { caste: 'कायस्थ/लाला', subCaste: 'निगम', category: 'सामान्य', religion: 'हिंदू' },
    'सिन्हा': { caste: 'कायस्थ/लाला', subCaste: 'सिन्हा', category: 'सामान्य', religion: 'हिंदू' },
    'सिंह': { caste: 'राजपूत/ठाकुर', subCaste: 'सिंह', category: 'सामान्य', religion: 'हिंदू' },
    'ठाकुर': { caste: 'राजपूत/ठाकुर', subCaste: 'ठाकुर', category: 'सामान्य', religion: 'हिंदू' },
    'चौहान': { caste: 'राजपूत/ठाकुर', subCaste: 'चौहान', category: 'सामान्य', religion: 'हिंदू' },
    'गुप्ता': { caste: 'वैश्य/गुप्ता', subCaste: 'गुप्ता', category: 'ओबीसी', religion: 'हिंदू' },
    'अग्रवाल': { caste: 'वैश्य/गुप्ता', subCaste: 'अग्रवाल', category: 'ओबीसी', religion: 'हिंदू' },
    'रस्तोगी': { caste: 'वैश्य/गुप्ता', subCaste: 'रस्तोगी', category: 'ओबीसी', religion: 'हिंदू' },
    'वर्मा': { caste: 'कुर्मी/वर्मा', subCaste: 'वर्मा', category: 'ओबीसी', religion: 'हिंदू' },
    'पटेल': { caste: 'कुर्मी/पटेल', subCaste: 'पटेल', category: 'ओबीसी', religion: 'हिंदू' },
    'गौतम': { caste: 'गौतम/जाटव', subCaste: 'गौतम/जाटव', category: 'एससी', religion: 'हिंदू' },
    'जाटव': { caste: 'गौतम/जाटव', subCaste: 'गौतम/जाटव', category: 'एससी', religion: 'हिंदू' },
    'यादव': { caste: 'यादव', subCaste: 'यादव', category: 'ओबीसी', religion: 'हिंदू' },
    'बिंद': { caste: 'बिंद', subCaste: 'बिंद', category: 'ओबीसी', religion: 'हिंदू' },
    'राजभर': { caste: 'राजभर', subCaste: 'राजभर', category: 'ओबीसी', religion: 'हिंदू' },
    'मौर्य': { caste: 'मौर्य/कुशवाहा', subCaste: 'मौर्य', category: 'ओबीसी', religion: 'हिंदू' },
    'कुशवाहा': { caste: 'मौर्य/कुशवाहा', subCaste: 'कुशवाहा', category: 'ओबीसी', religion: 'हिंदू' },
    'पासवान': { caste: 'पासवान', subCaste: 'पासवान', category: 'एससी', religion: 'हिंदू' },
    'मीणा': { caste: 'मीणा', subCaste: 'मीणा', category: 'एसटी', religion: 'हिंदू' },
    'विश्वकर्मा': { caste: 'विश्वकर्मा', subCaste: 'विश्वकर्मा', category: 'ओबीसी', religion: 'हिंदू' },
};

async function main() {
    console.log("=== STEP 1: FIX RELIGION FOR HINDU NAMES MISTAKENLY MARKED AS MUSLIM ===");
    
    // Find voters marked as Muslim but with Hindu names
    const allMuslimVoters = await prisma.voter.findMany({
        where: {
            OR: [
                { religion: "मुस्लिम" },
                { casteCategory: "मुस्लिम" },
                { caste: "मुस्लिम समुदाय" }
            ]
        }
    });
    console.log(`Found ${allMuslimVoters.length} voters currently marked as Muslim.`);

    let fixedReligionCount = 0;
    for (const voter of allMuslimVoters) {
        const fullStr = `${voter.name} ${voter.nameHi || ''} ${voter.relativeName || ''} ${voter.relativeNameHi || ''}`;
        const isHindu = HINDU_NAME_INDICATORS.some(ind => fullStr.includes(ind));

        if (isHindu) {
            // Re-evaluate surname/caste if present
            let newCaste = null;
            let newSubCaste = null;
            let newCat = "अज्ञात";

            for (const [sur, meta] of Object.entries(SURNAME_MAP)) {
                if (fullStr.includes(sur)) {
                    newCaste = meta.caste;
                    newSubCaste = meta.subCaste;
                    newCat = meta.category;
                    break;
                }
            }

            await prisma.voter.update({
                where: { id: voter.id },
                data: {
                    religion: "हिंदू",
                    casteCategory: newCat,
                    caste: newCaste,
                    subCaste: newSubCaste
                }
            });
            fixedReligionCount++;
        }
    }
    console.log(`✅ Fixed religion & category for ${fixedReligionCount} Hindu voters mistakenly marked as Muslim.`);

    console.log("\n=== STEP 2: EXTRACT SURNAMES FROM FULL NAMES AND RELATIVE NAMES ===");
    const allVoters = await prisma.voter.findMany();
    let directSurnameUpdates = 0;

    for (const voter of allVoters) {
        const nameText = `${voter.name || ''} ${voter.nameHi || ''} ${voter.relativeName || ''} ${voter.relativeNameHi || ''}`;
        
        for (const [sur, meta] of Object.entries(SURNAME_MAP)) {
            if (nameText.includes(sur)) {
                // If voter missing surname or caste or subCaste, update!
                if (!voter.caste || voter.casteCategory === "अज्ञात" || voter.caste === "मुस्लिम समुदाय") {
                    await prisma.voter.update({
                        where: { id: voter.id },
                        data: {
                            surname: sur,
                            caste: meta.caste,
                            subCaste: meta.subCaste,
                            casteCategory: meta.category,
                            religion: meta.religion
                        }
                    });
                    directSurnameUpdates++;
                }
                break;
            }
        }
    }
    console.log(`✅ Direct surname updates applied to ${directSurnameUpdates} voters.`);

    console.log("\n=== STEP 3: PROPAGATE CASTE AND RELIGION ACROSS FAMILY MEMBERS ===");
    // Group voters by family unit (familyId or houseNumber + village + boothNumber)
    const families = {};
    const updatedAllVoters = await prisma.voter.findMany();

    updatedAllVoters.forEach(v => {
        const key = v.familyId || `HOUSE_${v.assemblyId}_${v.boothNumber}_${v.village}_${v.houseNumber}`;
        if (!families[key]) families[key] = [];
        families[key].push(v);
    });

    console.log(`Total family units identified: ${Object.keys(families).length}`);

    let familyPropagatedCount = 0;

    for (const [famKey, members] of Object.entries(families)) {
        if (members.length < 2) continue; // Single person family doesn't propagate

        // Check if ANY family member has a valid known caste (not null, not unknown, not muslim unless verified)
        const casteMember = members.find(m => m.caste && m.caste !== 'मुस्लिम समुदाय' && m.casteCategory !== 'अज्ञात');

        if (casteMember) {
            const { caste, subCaste, casteCategory, religion, surname } = casteMember;

            for (const member of members) {
                // If this member needs caste update
                if (!member.caste || member.casteCategory === 'अज्ञात' || (religion === 'हिंदू' && member.religion === 'मुस्लिम')) {
                    await prisma.voter.update({
                        where: { id: member.id },
                        data: {
                            caste,
                            subCaste: member.subCaste || subCaste,
                            surname: member.surname || surname,
                            casteCategory,
                            religion: religion || 'हिंदू'
                        }
                    });
                    familyPropagatedCount++;
                }
            }
        }
    }

    console.log(`✅ Family Caste Propagation completed! Updated ${familyPropagatedCount} family members.`);

    // Check Ramesh & family again to verify
    console.log("\n=== VERIFYING RAMESH & FAMILY AFTER FIX ===");
    const ramesh = await prisma.voter.findFirst({ where: { epic: "JCV3598026" } });
    if (ramesh) {
        const fam = await prisma.voter.findMany({
            where: {
                houseNumber: ramesh.houseNumber,
                village: ramesh.village,
                boothNumber: ramesh.boothNumber
            }
        });
        fam.forEach(f => {
            console.log(`- ID: ${f.id} | Name: ${f.name} (${f.nameHi}) | Rel: ${f.relativeNameHi} | Caste: "${f.caste}" | SubCaste: "${f.subCaste}" | Category: "${f.casteCategory}" | Religion: "${f.religion}"`);
        });
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
