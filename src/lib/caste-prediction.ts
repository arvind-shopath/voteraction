/**
 * Module 6: Caste & Religion Prediction Engine (SRS Compliant)
 * 
 * Provides automated inference for Religion, Caste, and Caste Category
 * using a Master Surname Dictionary, Name Keyword tagging, and
 * Family Inheritance algorithms.
 */

export interface PredictionResult {
    religion: string;
    caste: string;
    subCaste?: string;
    casteCategory: 'General' | 'OBC' | 'SC' | 'ST' | 'Other';
    surname: string;
}

// Master Surname Dictionary
const SURNAME_MAP: Record<string, { caste: string; category: 'General' | 'OBC' | 'SC' | 'ST'; subCaste?: string }> = {
    // Brahmins (General)
    'शुक्ला': { caste: 'ब्राह्मण', category: 'General', subCaste: 'शुक्ला' },
    'shukla': { caste: 'ब्राह्मण', category: 'General', subCaste: 'शुक्ला' },
    'शर्मा': { caste: 'ब्राह्मण', category: 'General', subCaste: 'शर्मा' },
    'sharma': { caste: 'ब्राह्मण', category: 'General', subCaste: 'शर्मा' },
    'मिश्रा': { caste: 'ब्राह्मण', category: 'General', subCaste: 'मिश्रा' },
    'mishra': { caste: 'ब्राह्मण', category: 'General', subCaste: 'मिश्रा' },
    'पांडेय': { caste: 'ब्राह्मण', category: 'General', subCaste: 'पांडेय' },
    'pandey': { caste: 'ब्राह्मण', category: 'General', subCaste: 'पांडेय' },
    'द्विवेदी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'द्विवेदी' },
    'dwivedi': { caste: 'ब्राह्मण', category: 'General', subCaste: 'द्विवेदी' },
    'त्रिवेदी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'त्रिवेदी' },
    'trivedi': { caste: 'ब्राह्मण', category: 'General', subCaste: 'त्रिवेदी' },
    'दूबे': { caste: 'ब्राह्मण', category: 'General', subCaste: 'दूबे' },
    'dubey': { caste: 'ब्राह्मण', category: 'General', subCaste: 'दूबे' },
    'चौबे': { caste: 'ब्राह्मण', category: 'General', subCaste: 'चौबे' },
    'chaubey': { caste: 'ब्राह्मण', category: 'General', subCaste: 'चौबे' },
    'उपाध्याय': { caste: 'ब्राह्मण', category: 'General', subCaste: 'उपाध्याय' },
    'upadhyay': { caste: 'ब्राह्मण', category: 'General', subCaste: 'उपाध्याय' },
    'तिवारी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'तिवारी' },
    'tiwari': { caste: 'ब्राह्मण', category: 'General', subCaste: 'तिवारी' },
    'पाठक': { caste: 'ब्राह्मण', category: 'General', subCaste: 'पाठक' },
    'pathak': { caste: 'ब्राह्मण', category: 'General', subCaste: 'पाठक' },
    'जोशी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'जोशी' },
    'joshi': { caste: 'ब्राह्मण', category: 'General', subCaste: 'जोशी' },

    // Kshatriya / Rajput / Thakur (General)
    'सिंह': { caste: 'राजपूत/ठाकुर', category: 'General', subCaste: 'सिंह' },
    'singh': { caste: 'राजपूत/ठाकुर', category: 'General', subCaste: 'सिंह' },
    'राजपूत': { caste: 'राजपूत/ठाकुर', category: 'General', subCaste: 'राजपूत' },
    'rajput': { caste: 'राजपूत/ठाकुर', category: 'General', subCaste: 'राजपूत' },
    'ठाकुर': { caste: 'राजपूत/ठाकुर', category: 'General', subCaste: 'ठाकुर' },
    'thakur': { caste: 'राजपूत/ठाकुर', category: 'General', subCaste: 'ठाकुर' },
    'चौहान': { caste: 'राजपूत/ठाकुर', category: 'General', subCaste: 'चौहान' },
    'chauhan': { caste: 'राजपूत/ठाकुर', category: 'General', subCaste: 'चौहान' },
    'राठौड़': { caste: 'राजपूत/ठाकुर', category: 'General', subCaste: 'राठौड़' },
    'rathore': { caste: 'राजपूत/ठाकुर', category: 'General', subCaste: 'राठौड़' },
    'सोलंकी': { caste: 'राजपूत/ठाकुर', category: 'General', subCaste: 'सोलंकी' },
    'solanki': { caste: 'राजपूत/ठाकुर', category: 'General', subCaste: 'सोलंकी' },

    // Vaishya / Baniya (General)
    'गुप्त': { caste: 'वैश्य/गुप्ता', category: 'General', subCaste: 'गुप्ता' },
    'गुप्ता': { caste: 'वैश्य/गुप्ता', category: 'General', subCaste: 'गुप्ता' },
    'gupta': { caste: 'वैश्य/गुप्ता', category: 'General', subCaste: 'गुप्ता' },
    'अग्रवाल': { caste: 'वैश्य/अग्रवाल', category: 'General', subCaste: 'अग्रवाल' },
    'agarwal': { caste: 'वैश्य/अग्रवाल', category: 'General', subCaste: 'अग्रवाल' },
    'agrawal': { caste: 'वैश्य/अग्रवाल', category: 'General', subCaste: 'अग्रवाल' },
    'बंसल': { caste: 'वैश्य/अग्रवाल', category: 'General', subCaste: 'बंसल' },
    'bansal': { caste: 'वैश्य/अग्रवाल', category: 'General', subCaste: 'बंसल' },
    'गर्ग': { caste: 'वैश्य/अग्रवाल', category: 'General', subCaste: 'गर्ग' },
    'garg': { caste: 'वैश्य/अग्रवाल', category: 'General', subCaste: 'गर्ग' },
    'रस्तोगी': { caste: 'वैश्य/रस्तोगी', category: 'General', subCaste: 'रस्तोगी' },
    'rastogi': { caste: 'वैश्य/रस्तोगी', category: 'General', subCaste: 'रस्तोगी' },

    // OBC Categories
    'यादव': { caste: 'यादव', category: 'OBC', subCaste: 'यादव' },
    'yadav': { caste: 'यादव', category: 'OBC', subCaste: 'यादव' },
    'अहीर': { caste: 'यादव', category: 'OBC', subCaste: 'अहीर' },
    'ahir': { caste: 'यादव', category: 'OBC', subCaste: 'अहीर' },
    'मौर्य': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'मौर्य' },
    'maurya': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'मौर्य' },
    'कुशवाहा': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'कुशवाहा' },
    'kushwaha': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'कुशवाहा' },
    'सैनी': { caste: 'सैनी/मौर्य', category: 'OBC', subCaste: 'सैनी' },
    'saini': { caste: 'सैनी/मौर्य', category: 'OBC', subCaste: 'सैनी' },
    'कुर्मी': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'कुर्मी' },
    'kurmi': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'कुर्मी' },
    'पटेल': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'पटेल' },
    'patel': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'पटेल' },
    'गंगवार': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'गंगवार' },
    'gangwar': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'गंगवार' },
    'वर्मा': { caste: 'कुर्मी/वर्मा', category: 'OBC', subCaste: 'वर्मा' },
    'verma': { caste: 'कुर्मी/वर्मा', category: 'OBC', subCaste: 'वर्मा' },
    'जाट': { caste: 'जाट', category: 'OBC', subCaste: 'जाट' },
    'jat': { caste: 'जाट', category: 'OBC', subCaste: 'जाट' },
    'गुर्जर': { caste: 'गुर्जर', category: 'OBC', subCaste: 'गुर्जर' },
    'gurjar': { caste: 'गुर्जर', category: 'OBC', subCaste: 'गुर्जर' },
    'gujjjar': { caste: 'गुर्जर', category: 'OBC', subCaste: 'गुर्जर' },
    'विश्वकर्मा': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'विश्वकर्मा' },
    'vishwakarma': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'विश्वकर्मा' },
    'प्रजापति': { caste: 'प्रजापति/कुम्हार', category: 'OBC', subCaste: 'प्रजापति' },
    'prajapati': { caste: 'प्रजापति/कुम्हार', category: 'OBC', subCaste: 'प्रजापति' },
    'साहू': { caste: 'साहू/तेली', category: 'OBC', subCaste: 'साहू' },
    'sahu': { caste: 'साहू/तेली', category: 'OBC', subCaste: 'साहू' },
    'शाह': { caste: 'साहू/शाह', category: 'OBC', subCaste: 'शाह' },
    'गिरी': { caste: 'गोस्वामी/गिरी', category: 'OBC', subCaste: 'गिरी' },
    'giri': { caste: 'गोस्वामी/गिरी', category: 'OBC', subCaste: 'गिरी' },

    // Scheduled Caste (SC)
    'पासवान': { caste: 'पासवान', category: 'SC', subCaste: 'पासवान' },
    'paswan': { caste: 'पासवान', category: 'SC', subCaste: 'पासवान' },
    'राम': { caste: 'जाटव/राम', category: 'SC', subCaste: 'राम' },
    'ram': { caste: 'जाटव/राम', category: 'SC', subCaste: 'राम' },
    'पासी': { caste: 'पासी', category: 'SC', subCaste: 'पासी' },
    'pasi': { caste: 'पासी', category: 'SC', subCaste: 'पासी' },
    'जाटव': { caste: 'जाटव', category: 'SC', subCaste: 'जाटव' },
    'jatav': { caste: 'जाटव', category: 'SC', subCaste: 'जाटव' },
    'रविदास': { caste: 'रविदास/जाटव', category: 'SC', subCaste: 'रविदास' },
    'ravidas': { caste: 'रविदास/जाटव', category: 'SC', subCaste: 'रविदास' },
    'वाल्मीकि': { caste: 'वाल्मीकि', category: 'SC', subCaste: 'वाल्मीकि' },
    'valmiki': { caste: 'वाल्मीकि', category: 'SC', subCaste: 'वाल्मीकि' },
    'गौतम': { caste: 'गौतम/जाटव', category: 'SC', subCaste: 'गौतम' },
    'gautam': { caste: 'गौतम/जाटव', category: 'SC', subCaste: 'गौतम' },
    'सोनकर': { caste: 'सोनकर/खटीक', category: 'SC', subCaste: 'सोनकर' },
    'sonkar': { caste: 'सोनकर/खटीक', category: 'SC', subCaste: 'सोनकर' },
    'कोरी': { caste: 'कोरी', category: 'SC', subCaste: 'कोरी' },
    'kori': { caste: 'कोरी', category: 'SC', subCaste: 'कोरी' },

    // Scheduled Tribe (ST)
    'मीणा': { caste: 'मीणा', category: 'ST', subCaste: 'मीणा' },
    'meena': { caste: 'मीणा', category: 'ST', subCaste: 'मीणा' },
    'गोंड': { caste: 'गोंड', category: 'ST', subCaste: 'गोंड' },
    'gond': { caste: 'गोंड', category: 'ST', subCaste: 'गोंड' }
};

// Muslim Name / Surname Markers
const MUSLIM_MARKERS = [
    'खान', 'khan', 'अंसारी', 'ansari', 'अहमद', 'ahmed', 'ahmad', 'सिद्दीकी', 'siddiqui',
    'शाह', 'shah', 'बेगम', 'begum', 'मोहम्मद', 'mohammad', 'mohammed', 'md', 'आलम', 'alam',
    'रज़ा', 'raza', 'अली', 'ali', 'हुसैन', 'hussain', 'husain', 'पठान', 'pathan',
    'शेख', 'sheikh', 'seikh', 'shaikh', 'कुरैशी', 'qureshi', 'मंसूरी', 'mansoori',
    'सैयद', 'syed', 'परवीन', 'parveen', 'बानो', 'bano', 'फातिमा', 'fatima', 'खातुन', 'khatoon'
];

// Christian Name Markers
const CHRISTIAN_MARKERS = [
    'मसीह', 'masih', 'जॉसफ', 'joseph', 'डिसूज़ा', "d'souza", 'dsouza', 'पीटर', 'peter', 'जॉन', 'john'
];

// Noise words to ignore when extracting surname
const IGNORE_WORDS = new Set([
    'श्री', 'श्रीमती', 'कुमारी', 'देवी', 'प्रсад', 'लाल', 'राम', 'चंद्र', 'महतो', 'शाह',
    'shri', 'smt', 'km', 'kumar', 'kumari', 'devi', 'prasad', 'lal', 'ram', 'chandra',
    'mr', 'mrs', 'ms', 'dr'
]);

/**
 * Predicts Religion, Caste, Caste Category, and Surname from voter name & relative name.
 */
export function predictVoterAttributes(name: string, relativeName?: string): PredictionResult {
    const cleanName = (name || '').trim();
    const cleanRel = (relativeName || '').trim();
    const fullText = `${cleanName} ${cleanRel}`.toLowerCase();

    // 1. Religion Prediction
    let religion = 'हिंदू';
    for (const marker of MUSLIM_MARKERS) {
        if (fullText.includes(marker)) {
            religion = 'मुस्लिम';
            break;
        }
    }
    if (religion === 'हिंदू') {
        for (const marker of CHRISTIAN_MARKERS) {
            if (fullText.includes(marker)) {
                religion = 'ईसाई';
                break;
            }
        }
    }

    // 2. Extract Surname Candidate
    let extractedSurname = '';
    const tokens = cleanName.split(/\s+/).filter(t => t.length > 1);

    for (let i = tokens.length - 1; i >= 0; i--) {
        const word = tokens[i].toLowerCase().replace(/[^a-zA-Z\u0900-\u097F]/g, '');
        if (word && !IGNORE_WORDS.has(word)) {
            extractedSurname = tokens[i];
            break;
        }
    }

    // Fallback to relative's name surname if voter name gave no surname
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

    // 3. Caste & Category Lookup
    const lookupKey = extractedSurname.toLowerCase().trim();
    const mapped = SURNAME_MAP[lookupKey];

    if (mapped) {
        return {
            religion,
            caste: mapped.caste,
            subCaste: mapped.subCaste,
            casteCategory: mapped.category,
            surname: extractedSurname
        };
    }

    // Default for Muslim community if surname not matched
    if (religion === 'मुस्लिम') {
        return {
            religion: 'मुस्लिम',
            caste: 'मुस्लिम समुदाय',
            casteCategory: 'OBC',
            surname: extractedSurname || 'खान'
        };
    }

    return {
        religion,
        caste: extractedSurname ? extractedSurname : 'अन्य / अज्ञात',
        casteCategory: 'Other',
        surname: extractedSurname
    };
}
