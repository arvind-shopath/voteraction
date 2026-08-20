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
    // 1. ब्राह्मण (Brahmin - General)
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
    'dubey': { caste: 'ब्राह्मण', category: 'General', subCaste: 'दूबे' },
    'चौबे': { caste: 'ब्राह्मण', category: 'General', subCaste: 'चौबे' },
    'chaubey': { caste: 'ब्राह्मण', category: 'General', subCaste: 'चौबे' },
    'उपाध्याय': { caste: 'ब्राह्मण', category: 'General', subCaste: 'उपाध्याय' },
    'upadhyay': { caste: 'ब्राह्मण', category: 'General', subCaste: 'उपाध्याय' },
    'द्विवेदी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'द्विवेदी' },
    'dwivedi': { caste: 'ब्राह्मण', category: 'General', subCaste: 'द्विवेदी' },
    'त्रिवेदी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'त्रिवेदी' },
    'trivedi': { caste: 'ब्राह्मण', category: 'General', subCaste: 'त्रिवेदी' },
    'चतुर्वेदी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'चतुर्वेदी' },
    'पाठक': { caste: 'ब्राह्मण', category: 'General', subCaste: 'पाठक' },
    'pathak': { caste: 'ब्राह्मण', category: 'General', subCaste: 'पाठक' },
    'जोशी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'जोशी' },
    'joshi': { caste: 'ब्राह्मण', category: 'General', subCaste: 'जोशी' },
    'दीक्षित': { caste: 'ब्राह्मण', category: 'General', subCaste: 'दीक्षित' },
    'त्यागी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'त्यागी' },
    'tyagi': { caste: 'ब्राह्मण', category: 'General', subCaste: 'त्यागी' },
    'tyagee': { caste: 'ब्राह्मण', category: 'General', subCaste: 'त्यागी' },
    'झा': { caste: 'ब्राह्मण', category: 'General', subCaste: 'झा' },
    'jha': { caste: 'ब्राह्मण', category: 'General', subCaste: 'झा' },

    // 2. क्षत्रिय / राजपूत / ठाकुर (General)
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
    'rathore': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'राठौड़' },
    'सोलंकी': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'सोलंकी' },
    'solanki': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'सोलंकी' },
    'तोमर': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'तोमर' },
    'tomar': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'तोमर' },
    'रघुवंशी': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'रघुवंशी' },

    // 3. कायस्थ / लाला (General)
    'कायस्थ': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'कायस्थ' },
    'kayastha': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'कायस्थ' },
    'लाला': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'लाला' },
    'lala': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'लाला' },
    'श्रीवास्तव': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'श्रीवास्तव' },
    'shrivastava': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'श्रीवास्तव' },
    'srivastava': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'श्रीवास्तव' },
    'सक्सेना': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'सक्सेना' },
    'saxena': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'सक्सेना' },
    'निगम': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'निगम' },
    'nigam': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'निगम' },
    'माथुर': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'माथुर' },
    'mathur': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'माथुर' },
    'भटनागर': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'भटनागर' },
    'अस्थाना': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'अस्थाना' },
    'खरे': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'खरे' },

    // 4. वैश्य / बनिया (General)
    'वैश्य': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'वैश्य' },
    'बनिया': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'बनिया' },
    'गुप्त': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'गुप्ता' },
    'गुप्ता': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'गुप्ता' },
    'gupta': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'गुप्ता' },
    'अग्रवाल': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'अग्रवाल' },
    'agarwal': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'अग्रवाल' },
    'agrawal': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'अग्रवाल' },
    'बंसल': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'बंसल' },
    'bansal': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'बंसल' },
    'गर्ग': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'गर्ग' },
    'जायसवाल': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'जायसवाल' },
    'jaiswal': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'जायसवाल' },
    'रस्तोगी': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'रस्तोगी' },
    'केसरवानी': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'केसरवानी' },
    'मोदनवाल': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'मोदनवाल' },
    'बरनवाल': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'बरनवाल' },
    'सेठ': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'सेठ' },
    'seth': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'सेठ' },

    // 5. यादव (OBC)
    'यादव': { caste: 'यादव', category: 'OBC', subCaste: 'यादव' },
    'yadav': { caste: 'यादव', category: 'OBC', subCaste: 'यादव' },
    'याद': { caste: 'यादव', category: 'OBC', subCaste: 'यादव' },
    'yad': { caste: 'यादव', category: 'OBC', subCaste: 'यादव' },
    'अहीर': { caste: 'यादव', category: 'OBC', subCaste: 'अहीर' },
    'ahir': { caste: 'यादव', category: 'OBC', subCaste: 'अहीर' },

    // 6. बिंद / निषाद / मल्लाह (OBC)
    'बिंद': { caste: 'बिंद', category: 'OBC', subCaste: 'बिंद' },
    'बिन्द': { caste: 'बिंद', category: 'OBC', subCaste: 'बिंद' },
    'bind': { caste: 'बिंद', category: 'OBC', subCaste: 'बिंद' },
    'निषाद': { caste: 'बिंद', category: 'OBC', subCaste: 'निषाद' },
    'nishad': { caste: 'बिंद', category: 'OBC', subCaste: 'निषाद' },
    'मल्लाह': { caste: 'बिंद', category: 'OBC', subCaste: 'मल्लाह' },
    'mallah': { caste: 'बिंद', category: 'OBC', subCaste: 'मल्लाह' },
    'mallaha': { caste: 'बिंद', category: 'OBC', subCaste: 'मल्लाह' },
    'कश्यप': { caste: 'बिंद', category: 'OBC', subCaste: 'कश्यप' },
    'साहनी': { caste: 'बिंद', category: 'OBC', subCaste: 'साहनी' },
    'केवट': { caste: 'बिंद', category: 'OBC', subCaste: 'केवट' },
    'मांझी': { caste: 'बिंद', category: 'OBC', subCaste: 'मांझी' },

    // 7. राजभर (OBC)
    'राजभर': { caste: 'राजभर', category: 'OBC', subCaste: 'राजभर' },
    'rajbhar': { caste: 'राजभर', category: 'OBC', subCaste: 'राजभर' },
    'भर': { caste: 'राजभर', category: 'OBC', subCaste: 'राजभर' },
    'bhar': { caste: 'राजभर', category: 'OBC', subCaste: 'राजभर' },

    // 8. मौर्य / कुशवाहा (OBC)
    'मौर्य': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'मौर्य' },
    'maurya': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'मौर्य' },
    'कुशवाहा': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'कुशवाहा' },
    'kushwaha': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'कुशवाहा' },
    'सैनी': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'सैनी' },
    'शाक्य': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'शाक्य' },

    // 9. कुर्मी / पटेल (OBC)
    'कुर्मी': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'कुर्मी' },
    'kurmi': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'कुर्मी' },
    'पटेल': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'पटेल' },
    'patel': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'पटेल' },
    'गंगवार': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'गंगवार' },
    'वर्मा': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'वर्मा' },
    'verma': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'वर्मा' },

    // 10. विश्वकर्मा / प्रजापति (OBC)
    'विश्वकर्मा': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'विश्वकर्मा' },
    'vishwakarma': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'विश्वकर्मा' },
    'लोहार': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'लोहार' },
    'बढ़ई': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'बढ़ई' },
    'प्रजापति': { caste: 'प्रजापति/कुम्हार', category: 'OBC', subCaste: 'प्रजापति' },
    'prajapati': { caste: 'प्रजापति/कुम्हार', category: 'OBC', subCaste: 'प्रजापति' },
    'कुम्हार': { caste: 'प्रजापति/कुम्हार', category: 'OBC', subCaste: 'कुम्हार' },

    // 11. जाटव / रविदास / SC
    'जाटव': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'जाटव' },
    'jatav': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'जाटव' },
    'रविदास': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'रविदास' },
    'गौतम': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'गौतम' },
    'gautam': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'गौतम' },
    'भारती': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'भारती' },
    'bharati': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'भारती' },
    'bharatee': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'भारती' },
    'राम': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'राम' },
    'ram': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'राम' },

    // 12. पासी / पासवान (SC)
    'पासी': { caste: 'पासी', category: 'SC', subCaste: 'पासी' },
    'pasi': { caste: 'पासी', category: 'SC', subCaste: 'पासी' },
    'सरोज': { caste: 'पासी', category: 'SC', subCaste: 'सरोज' },
    'रावत': { caste: 'पासी', category: 'SC', subCaste: 'रावत' },
    'पासवान': { caste: 'पासवान', category: 'SC', subCaste: 'पासवान' },
    'paswan': { caste: 'पासवान', category: 'SC', subCaste: 'पासवान' },
    'वाल्मीकि': { caste: 'वाल्मीकि', category: 'SC', subCaste: 'वाल्मीकि' },
    'सोनकर': { caste: 'सोनकर/खटीक', category: 'SC', subCaste: 'सोनकर' },
    'खटीक': { caste: 'सोनकर/खटीक', category: 'SC', subCaste: 'खटीक' },
    'धोबी': { caste: 'धोबी/कनौजिया', category: 'SC', subCaste: 'धोबी' },
    'कनौजिया': { caste: 'धोबी/कनौजिया', category: 'SC', subCaste: 'कनौजिया' },
    'कोरी': { caste: 'कोरी', category: 'SC', subCaste: 'कोरी' },

    // 13. ST
    'मीणा': { caste: 'मीणा', category: 'ST', subCaste: 'मीणा' },
    'गोंड': { caste: 'गोंड', category: 'ST', subCaste: 'गोंड' }
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
            casteCategory: 'Muslim' as any,
            surname: extractedSurname || 'खान'
        };
    }

    return {
        religion,
        caste: 'अन्य / अज्ञात',
        casteCategory: 'Other',
        surname: extractedSurname
    };
}

