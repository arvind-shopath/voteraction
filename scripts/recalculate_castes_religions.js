const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Inlined enhanced prediction function for script execution
const SURNAME_MAP = {
    'ब्राह्मण': { caste: 'ब्राह्मण', category: 'General', subCaste: 'ब्राह्मण' },
    'brahmin': { caste: 'ब्राह्मण', category: 'General', subCaste: 'ब्राह्मण' },
    'शुक्ला': { caste: 'ब्राह्मण', category: 'General', subCaste: 'शुक्ला' },
    'shukla': { caste: 'ब्राह्मण', category: 'General', subCaste: 'शुक्ला' },
    'शर्मा': { caste: 'ब्राह्मण', category: 'General', subCaste: 'शर्मा' },
    'sharma': { caste: 'ब्राह्मण', category: 'General', subCaste: 'शर्मा' },
    'मिश्रा': { caste: 'ब्राह्मण', category: 'General', subCaste: 'मिश्रा' },
    'mishra': { caste: 'ब्राह्मण', category: 'General', subCaste: 'मिश्रा' },
    'पांडेय': { caste: 'ब्राह्मण', category: 'General', subCaste: 'पांडेय' },
    'पांडे': { caste: 'ब्राह्मण', category: 'General', subCaste: 'पांडेय' },
    'pandey': { caste: 'ब्राह्मण', category: 'General', subCaste: 'पांडेय' },
    'तिवारी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'तिवारी' },
    'tiwari': { caste: 'ब्राह्मण', category: 'General', subCaste: 'तिवारी' },
    'दूबे': { caste: 'ब्राह्मण', category: 'General', subCaste: 'दूबे' },
    'दुबे': { caste: 'ब्राह्मण', category: 'General', subCaste: 'दूबे' },
    'dubey': { caste: 'ब्राह्मण', category: 'General', subCaste: 'दूबे' },
    'चौबे': { caste: 'ब्राह्मण', category: 'General', subCaste: 'चौबे' },
    'chaubey': { caste: 'ब्राह्मण', category: 'General', subCaste: 'चौबे' },
    'उपाध्याय': { caste: 'ब्राह्मण', category: 'General', subCaste: 'उपाध्याय' },
    'upadhyay': { caste: 'ब्राह्मण', category: 'General', subCaste: 'उपाध्याय' },
    'द्विवेदी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'द्विवेदी' },
    'पाठक': { caste: 'ब्राह्मण', category: 'General', subCaste: 'पाठक' },
    'pathak': { caste: 'ब्राह्मण', category: 'General', subCaste: 'पाठक' },
    'जोशी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'जोशी' },
    'दीक्षित': { caste: 'ब्राह्मण', category: 'General', subCaste: 'दीक्षित' },
    'त्यागी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'त्यागी' },
    'झा': { caste: 'ब्राह्मण', category: 'General', subCaste: 'झा' },
    'क्षत्रिय': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'क्षत्रिय' },
    'राजपूत': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'राजपूत' },
    'rajput': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'राजपूत' },
    'ठाकुर': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'ठाकुर' },
    'thakur': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'ठाकुर' },
    'सिंह': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'सिंह' },
    'singh': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'सिंह' },
    'चौहान': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'चौहान' },
    'chauhan': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'चौहान' },
    'राठौड़': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'राठौड़' },
    'सोलंकी': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'सोलंकी' },
    'तोमर': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'तोमर' },
    'रघुवंशी': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'रघुवंशी' },
    'कायस्थ': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'कायस्थ' },
    'लाला': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'लाला' },
    'श्रीवास्तव': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'श्रीवास्तव' },
    'shrivastava': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'श्रीवास्तव' },
    'srivastava': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'श्रीवास्तव' },
    'सक्सेना': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'सक्सेना' },
    'निगम': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'निगम' },
    'माथुर': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'माथुर' },
    'वैश्य': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'वैश्य' },
    'बनिया': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'बनिया' },
    'गुप्त': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'गुप्ता' },
    'गुप्ता': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'गुप्ता' },
    'gupta': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'गुप्ता' },
    'अग्रवाल': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'अग्रवाल' },
    'agarwal': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'अग्रवाल' },
    'बंसल': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'बंसल' },
    'जायसवाल': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'जायसवाल' },
    'jaiswal': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'जायसवाल' },
    'चौरसिया': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'चौरसिया' },
    'chaurasia': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'चौरसिया' },
    'साहू': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'साहू' },
    'यादव': { caste: 'यादव/अहीर', category: 'OBC', subCaste: 'यादव' },
    'yadav': { caste: 'यादव/अहीर', category: 'OBC', subCaste: 'यादव' },
    'अहीर': { caste: 'यादव/अहीर', category: 'OBC', subCaste: 'अहीर' },
    'कुर्मी': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'कुर्मी' },
    'kurmi': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'कुर्मी' },
    'पटेल': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'पटेल' },
    'patel': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'पटेल' },
    'वर्मा': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'वर्मा' },
    'verma': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'वर्मा' },
    'मौर्य': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'मौर्य' },
    'maurya': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'मौर्य' },
    'कुशवाहा': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'कुशवाहा' },
    'kushwaha': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'कुशवाहा' },
    'सैनी': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'सैनी' },
    'राजभर': { caste: 'राजभर', category: 'OBC', subCaste: 'राजभर' },
    'rajbhar': { caste: 'राजभर', category: 'OBC', subCaste: 'राजभर' },
    'बिंद': { caste: 'बिंद/निषाद', category: 'OBC', subCaste: 'बिंद' },
    'bind': { caste: 'बिंद/निषाद', category: 'OBC', subCaste: 'बिंद' },
    'निषाद': { caste: 'बिंद/निषाद', category: 'OBC', subCaste: 'निषाद' },
    'nishad': { caste: 'बिंद/निषाद', category: 'OBC', subCaste: 'निषाद' },
    'मल्लाह': { caste: 'बिंद/निषाद', category: 'OBC', subCaste: 'मल्लाह' },
    'कश्यप': { caste: 'बिंद/निषाद', category: 'OBC', subCaste: 'कश्यप' },
    'प्रजापति': { caste: 'प्रजापति/कुम्हार', category: 'OBC', subCaste: 'प्रजापति' },
    'prajapati': { caste: 'प्रजापति/कुम्हार', category: 'OBC', subCaste: 'प्रजापति' },
    'कुम्हार': { caste: 'प्रजापति/कुम्हार', category: 'OBC', subCaste: 'कुम्हार' },
    'विश्वकर्मा': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'विश्वकर्मा' },
    'vishwakarma': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'विश्वकर्मा' },
    'लोहार': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'लोहार' },
    'बढ़ई': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'बढ़ई' },
    'पाल': { caste: 'पाल/गडरिया', category: 'OBC', subCaste: 'पाल' },
    'pal': { caste: 'पाल/गडरिया', category: 'OBC', subCaste: 'पाल' },
    'जाटव': { caste: 'जाटव/चमार', category: 'SC', subCaste: 'जाटव' },
    'jatav': { caste: 'जाटव/चमार', category: 'SC', subCaste: 'जाटव' },
    'चमार': { caste: 'जाटव/चमार', category: 'SC', subCaste: 'चमार' },
    'भारती': { caste: 'जाटव/चमार', category: 'SC', subCaste: 'भारती' },
    'bharti': { caste: 'जाटव/चमार', category: 'SC', subCaste: 'भारती' },
    'गौतम': { caste: 'जाटव/चमार', category: 'SC', subCaste: 'गौतम' },
    'पासी': { caste: 'पासी', category: 'SC', subCaste: 'पासी' },
    'सरोज': { caste: 'पासी', category: 'SC', subCaste: 'सरोज' },
    'पासवान': { caste: 'पासवान', category: 'SC', subCaste: 'पासवान' },
    'वाल्मीकि': { caste: 'वाल्मीकि', category: 'SC', subCaste: 'वाल्मीकि' },
    'सोनकर': { caste: 'सोनकर/खटीक', category: 'SC', subCaste: 'सोनकर' },
    'खटीक': { caste: 'सोनकर/खटीक', category: 'SC', subCaste: 'खटीक' },
    'धोबी': { caste: 'धोबी/कनौजिया', category: 'SC', subCaste: 'धोबी' },
    'कनौजिया': { caste: 'धोबी/कनौजिया', category: 'SC', subCaste: 'कनौजिया' },
    'कोरी': { caste: 'कोरी', category: 'SC', subCaste: 'कोरी' },
    'मीणा': { caste: 'मीणा', category: 'ST', subCaste: 'मीणा' },
    'गोंड': { caste: 'गोंड', category: 'ST', subCaste: 'गोंड' },
    'अंसारी': { caste: 'अंसारी/जुलाहा', category: 'OBC', subCaste: 'अंसारी' },
    'ansari': { caste: 'अंसारी/जुलाहा', category: 'OBC', subCaste: 'अंसारी' },
    'खान': { caste: 'पठान/खान', category: 'General', subCaste: 'खान' },
    'khan': { caste: 'पठान/खान', category: 'General', subCaste: 'खान' },
    'सिद्दीकी': { caste: 'शेख/सिद्दीकी', category: 'General', subCaste: 'सिद्दीकी' },
    'siddiqui': { caste: 'शेख/सिद्दीकी', category: 'General', subCaste: 'सिद्दीकी' },
    'कुरैशी': { caste: 'कुरैशी/कसाब', category: 'OBC', subCaste: 'कुरैशी' },
    'qureshi': { caste: 'कुरैशी/कसाब', category: 'OBC', subCaste: 'कुरैशी' },
    'मंसूरी': { caste: 'मंसूरी/धुनिया', category: 'OBC', subCaste: 'मंसूरी' },
    'mansoori': { caste: 'मंसूरी/धुनिया', category: 'OBC', subCaste: 'मंसूरी' },
    'सैयद': { caste: 'सैयद', category: 'General', subCaste: 'सैयद' },
    'syed': { caste: 'सैयद', category: 'General', subCaste: 'सैयद' },
    'पठान': { caste: 'पठान/खान', category: 'General', subCaste: 'पठान' },
    'शेख': { caste: 'शेख/सिद्दीकी', category: 'General', subCaste: 'शेख' }
};

const MUSLIM_STANDALONE_WORDS = new Set([
    'खान', 'khan', 'अंसारी', 'ansari', 'अहमद', 'ahmed', 'ahmad', 'सिद्दीकी', 'siddiqui',
    'बेगम', 'begum', 'मोहम्मद', 'mohammad', 'mohammed', 'मोहम्म्द', 'आलम', 'alam',
    'हुसैन', 'hussain', 'husain', 'पठान', 'pathan',
    'शेख', 'sheikh', 'seikh', 'shaikh', 'कुरैशी', 'qureshi', 'मंसूरी', 'mansoori',
    'सैयद', 'syed', 'परवीन', 'parveen', 'बानो', 'bano', 'फातिमा', 'fatima', 'खातून', 'खातुन', 'khatoon',
    'उस्मानी', 'usmani', 'हसन', 'hasan', 'अख्तर', 'akhtar', 'इरफान', 'irfan', 'इमरान', 'imran',
    'जावेद', 'javed', 'तारीक', 'tariq', 'शबनम', 'shabnam', 'रुबीना', 'rubina', 'नसीम', 'naseem',
    'शमशाद', 'shamshad', 'सलीम', 'saleem', 'salim', 'वाहिद', 'wahid', 'जमील', 'jameel'
]);

const HINDU_FIRST_NAMES = new Set([
    'रमेश', 'ramesh', 'सुरेश', 'suresh', 'दिनेश', 'dinesh', 'राजेश', 'rajesh', 'महेश', 'mahesh',
    'संदीप', 'sandeep', 'पूजा', 'pooja', 'puja', 'निर्मला', 'nirmala', 'कालिका', 'kalika',
    'अभिषेक', 'abhishek', 'अमित', 'amit', 'सुमित', 'sumit', 'अजय', 'ajay', 'विजय', 'vijay',
    'संजय', 'sanjay', 'पंकज', 'pankaj', 'मनोज', 'manoj', 'विकास', 'vikas', 'विशाल', 'vishal',
    'दीपक', 'deepak', 'राहुल', 'rahul', 'रोहित', 'rohit', 'प्रदीप', 'pradeep', 'संतोष', 'santosh',
    'सुनील', 'sunil', 'अनिल', 'anil', 'राजेंद्र', 'rajendra', 'महेंद्र', 'mahendra', 'जितेंद्र', 'jitendra',
    'सविता', 'savita', 'सुनीता', 'sunita', 'अनिता', 'anita', 'रीता', 'rita', 'गीता', 'geeta',
    'सीमा', 'seema', 'सुमन', 'suman', 'रेखा', 'rekha', 'आशा', 'asha', 'ममता', 'mamta',
    'कमला', 'kamla', 'उषा', 'usha', 'राधा', 'radha', 'आरती', 'aarti', 'arti', 'प्रिया', 'priya',
    'नेहा', 'neha', 'पूनम', 'poonam', 'संगीता', 'sangeeta', 'राम', 'ram', 'कृष्ण', 'krishna',
    'शिव', 'shiva', 'shiv', 'विष्णु', 'vishnu', 'गणेश', 'ganesh', 'हनुमान', 'hanuman'
]);

const IGNORE_WORDS = new Set([
    'श्री', 'श्रीमती', 'कुमारी', 'देवी', 'प्रसाद', 'लाल', 'राम', 'चंद्र', 'महतो',
    'shri', 'smt', 'km', 'kumar', 'kumari', 'devi', 'prasad', 'lal', 'ram', 'chandra',
    'mr', 'mrs', 'ms', 'dr', 'singh', 'sing'
]);

function predict(name, relativeName) {
    const cleanName = (name || '').trim();
    const cleanRel = (relativeName || '').trim();

    const rawTokens = `${cleanName} ${cleanRel}`
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1);

    let extractedSurname = '';
    const nameTokens = cleanName.split(/\s+/).filter(t => t.length > 1);

    for (let i = nameTokens.length - 1; i >= 0; i--) {
        const word = nameTokens[i].toLowerCase().replace(/[^a-zA-Z\u0900-\u097F]/g, '');
        if (word && !IGNORE_WORDS.has(word)) {
            extractedSurname = nameTokens[i];
            break;
        }
    }

    if (!extractedSurname && cleanRel) {
        const relTokens = cleanRel.split(/\s+/).filter(t => t.length > 1);
        for (let i = relTokens.length - 1; i >= 0; i--) {
            const word = relTokens[i].toLowerCase().replace(/[^a-zA-Z\u0900-\u097F]/g, '');
            if (word && !IGNORE_WORDS.has(word)) {
                extractedSurname = relTokens[i];
                break;
            }
        }
    }

    const lookupKey = extractedSurname.toLowerCase().trim();
    const mapped = SURNAME_MAP[lookupKey];

    let hasHinduName = false;
    for (const t of rawTokens) {
        if (HINDU_FIRST_NAMES.has(t)) {
            hasHinduName = true;
            break;
        }
    }

    let hasMuslimMarker = false;
    for (const t of rawTokens) {
        if (MUSLIM_STANDALONE_WORDS.has(t)) {
            hasMuslimMarker = true;
            break;
        }
    }

    let religion = 'हिंदू';
    if (hasMuslimMarker && !hasHinduName) {
        religion = 'मुस्लिम';
    } else {
        religion = 'हिंदू';
    }

    if (mapped) {
        const isMuslimCaste = mapped.caste.includes('अंसारी') || mapped.caste.includes('खान') || mapped.caste.includes('सिद्दीकी') || mapped.caste.includes('कुरैशी') || mapped.caste.includes('मंसूरी') || mapped.caste.includes('सैयद') || mapped.caste.includes('पठान') || mapped.caste.includes('शेख');
        return {
            religion: isMuslimCaste ? 'मुस्लिम' : 'हिंदू',
            caste: mapped.caste,
            subCaste: mapped.subCaste,
            casteCategory: mapped.category,
            surname: extractedSurname
        };
    }

    if (religion === 'मुस्लिम') {
        return {
            religion: 'मुस्लिम',
            caste: 'मुस्लिम समुदाय',
            casteCategory: 'Other',
            surname: extractedSurname || 'खान'
        };
    }

    return {
        religion: 'हिंदू',
        caste: 'सामान्य / अन्य',
        casteCategory: 'Other',
        surname: extractedSurname || 'सामान्य'
    };
}

async function run() {
    console.log('Recalculating all voter religions and castes with enhanced engine...');
    const voters = await prisma.voter.findMany({
        select: { id: true, name: true, relativeName: true, caste: true, religion: true }
    });

    console.log(`Analyzing ${voters.length} voters...`);
    let updated = 0;

    for (const v of voters) {
        const pred = predict(v.name, v.relativeName);
        if (v.caste !== pred.caste || v.religion !== pred.religion) {
            await prisma.voter.update({
                where: { id: v.id },
                data: {
                    caste: pred.caste,
                    subCaste: pred.subCaste || null,
                    casteCategory: pred.casteCategory || 'Other',
                    religion: pred.religion,
                    surname: pred.surname || null
                }
            });
            updated++;
        }
    }

    console.log(`Successfully corrected ${updated} voters in the database!`);
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
