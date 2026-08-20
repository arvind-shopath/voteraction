/**
 * SRS 3.0 Transliteration Engine (Dual-Path: English <-> Hindi)
 * High-precision phonetic converter & dictionary mapper.
 * Fixes all raw character leakages (like 'a्') and provides clean English transliteration.
 */

// Common Dictionary for ultra-fast, 100% accurate mapping (Bilingual)
const NAME_DICTIONARY: Record<string, string> = {
    // Surnames & Caste Names
    'pandey': 'पांडेय',
    'pande': 'पांडे',
    'shukla': 'शुक्ला',
    'kaushal': 'कौशल',
    'saxena': 'सक्सेना',
    'ram': 'राम',
    'kumar': 'कुमार',
    'singh': 'सिंह',
    'yadav': 'यादव',
    'verma': 'वर्मा',
    'sharma': 'शर्मा',
    'gupta': 'गुप्ता',
    'mishra': 'मिश्रा',
    'tiwari': 'तिवारी',
    'dwivedi': 'द्विवेदी',
    'tripathi': 'त्रिपाठी',
    'dubey': 'दुबे',
    'chaubey': 'चौबे',
    'joshi': 'जोशी',
    'bhatt': 'भट्ट',
    'patel': 'पटेल',
    'shah': 'शाह',
    'mehta': 'मेहता',
    'jain': 'जैन',
    'khan': 'खान',
    'ansari': 'अंसारी',
    'ahmad': 'अहमद',
    'ahmed': 'अहमद',
    'ali': 'अली',
    'sheikh': 'शेख',
    'siddiqui': 'सिद्दीकी',
    'alam': 'आलम',
    'husain': 'हुसैन',
    'hussain': 'हुसैन',
    'raza': 'रज़ा',
    'mohammad': 'मोहम्मद',
    'mohammed': 'मोहम्मद',
    'muhammad': 'मोहम्मद',
    'kaur': 'कौर',
    'das': 'दास',
    'dutta': 'दत्ता',
    'banerjee': 'बनर्जी',
    'chatterjee': 'चैटर्जी',
    'choudhary': 'चौधरी',
    'chowdhury': 'चौधरी',
    'paswan': 'पासवान',
    'gautam': 'गौतम',
    'kumari': 'कुमारी',
    'devi': 'देवी',
    'lata': 'लता',
    'rahi': 'राही',
    'prasad': 'प्रसाद',
    'lal': 'लाल',
    'chand': 'चंद',
    'pal': 'पाल',
    'prakash': 'प्रकाश',
    'kishore': 'किशोर',
    'mohan': 'मोहन',
    'sohan': 'सोहन',
    'rohan': 'रोहन',
    'rahul': 'राहुल',
    'amit': 'अमित',
    'sumit': 'सुमित',
    'sunil': 'सुनील',
    'anil': 'अनिल',
    'rajesh': 'राजेश',
    'suresh': 'सुरेश',
    'ramesh': 'रमेश',
    'dinesh': 'दिनेश',
    'mahesh': 'महेश',
    'mukesh': 'मुकेश',
    'naresh': 'नरेश',
    'vijay': 'विजय',
    'sanjay': 'संजय',
    'ajay': 'अजय',
    'manoj': 'मनोज',
    'vinod': 'विनोद',
    'pradeep': 'प्रदीप',
    'sandeep': 'संदीप',
    'kuldeep': 'कुलदीप',
    'pawan': 'पवन',
    'vikas': 'विकास',
    'vishal': 'विशाल',
    'vivek': 'विवेक',
    'deepak': 'दीपक',
    'ashok': 'अशोक',
    'alok': 'आलोक',
    'anand': 'आनंद',
    'abhishek': 'अभिषेक',
    'saurabh': 'सौरभ',
    'gaurav': 'गौरव',
    'pankaj': 'पंकज',
    'neeraj': 'नीरज',
    'dheeraj': 'धीरज',
    'suraj': 'सूरज',
    'sunita': 'सुनीता',
    'anita': 'अनीता',
    'kavita': 'कविता',
    'savita': 'सविता',
    'geeta': 'गीता',
    'tara': 'तारा',
    'seema': 'सीमा',
    'reena': 'रीना',
    'meena': 'मीना',
    'pooja': 'पूजा',
    'priya': 'प्रिया',
    'priyanka': 'प्रियंका',
    'pinki': 'पिंकी',
    'neha': 'नेहा',
    'sneha': 'स्नेहा',
    'shweta': 'श्वेता',
    'poornima': 'पूर्णिमा',
    'archana': 'अर्चना',
    'sadhna': 'साधना',
    'vandana': 'वंदना',
    'manju': 'मंजू',
    'anju': 'अंजू',
    'rekha': 'रेखा',
    'sushma': 'सुषमा',
    'pushpa': 'पुष्पा',
    'khushboo': 'खुशबू',
    'arvind': 'अरविंद',
    'parmeshwar': 'परमेश्वर',
    'ashutosh': 'आशुतोष',
    'ruchi': 'रूची',
    'bichawnath': 'बिचावनाथ',

    // Locations & Relations
    'male': 'पुरुष',
    'female': 'महिला',
    'third gender': 'अन्य',
    'father': 'पिता',
    'husband': 'पति',
    'mother': 'माता',
    'other': 'अन्य',
    'lucknow': 'लखनऊ',
    'malihabad': 'मलिहाबाद',
    'sikta': 'सिकता',
    'ghazipur': 'गाजीपुर',
    'patna': 'पटना',
    'bihar': 'बिहार',
    'uttar pradesh': 'उत्तर प्रदेश'
};

// Build Reverse Dictionary (Hindi -> Title Case English)
const REVERSE_DICTIONARY: Record<string, string> = {
    'खुशबू': 'Khushboo',
    'खुशबु': 'Khushboo',
    'पाण्डेय': 'Pandey',
    'पांडेय': 'Pandey',
    'पांडे': 'Pandey',
    'अरविन्द': 'Arvind',
    'अरविंद': 'Arvind',
    'परमेश्वर': 'Parmeshwar',
    'गीता': 'Geeta',
    'तारा': 'Tara',
    'प्रियंका': 'Priyanka',
    'रूची': 'Ruchi',
    'रुची': 'Ruchi',
    'रूचि': 'Ruchi',
    'आशुतोष': 'Ashutosh',
    'बिचावनाथ': 'Bichawnath',
    'सौरी': 'Sauri',
    'गाज़ीपुर': 'Ghazipur',
    'गाजीपुर': 'Ghazipur',
    'वाढू': 'Wadhu',
    'बाळू': 'Wadhu',
    'बालू': 'Wadhu'
};

for (const [en, hi] of Object.entries(NAME_DICTIONARY)) {
    if (!REVERSE_DICTIONARY[hi]) {
        REVERSE_DICTIONARY[hi] = en.charAt(0).toUpperCase() + en.slice(1);
    }
}

// Character Mapping Rules for Phonetic Fallback (EN -> HI)
const MULTI_CHAR_MAP: [RegExp, string][] = [
    [/ksh/gi, 'क्ष'], [/gy/gi, 'ज्ञ'], [/tr/gi, 'त्र'], [/sh/gi, 'श'], [/ch/gi, 'च'],
    [/kh/gi, 'ख'], [/gh/gi, 'घ'], [/th/gi, 'थ'], [/dh/gi, 'ध'], [/ph/gi, 'फ'],
    [/bh/gi, 'भ'], [/ee/gi, 'ई'], [/oo/gi, 'ऊ'], [/aa/gi, 'आ'], [/ai/gi, 'ऐ'], [/au/gi, 'औ']
];

const SINGLE_CHAR_MAP: Record<string, string> = {
    'a': 'अ', 'b': 'ब', 'c': 'क', 'd': 'द', 'e': 'ए', 'f': 'फ', 'g': 'ग',
    'h': 'ह', 'i': 'इ', 'j': 'ज', 'k': 'क', 'l': 'ल', 'm': 'म', 'n': 'न',
    'o': 'ओ', 'p': 'प', 'q': 'क', 'r': 'र', 's': 'स', 't': 'त', 'u': 'उ',
    'v': 'व', 'w': 'व', 'x': 'क्स', 'y': 'य', 'z': 'ज़'
};

// Independent Vowels (Swar)
const VOWEL_MAP: Record<string, string> = {
    'अ': 'A', 'आ': 'Aa', 'इ': 'I', 'ई': 'Ee', 'उ': 'U', 'ऊ': 'Oo', 'ऋ': 'Ri',
    'ए': 'E', 'ऐ': 'Ai', 'ओ': 'O', 'औ': 'Au'
};

// Consonants (Vyanjan) - Base consonant sound without inherent vowel
const CONSONANT_MAP: Record<string, string> = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gy', 'ड़': 'r', 'ढ़': 'rh', 'फ़': 'f', 'ज़': 'z'
};

// Dependent Vowels (Matra)
const MATRA_MAP: Record<string, string> = {
    'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ँ': 'n', 'ः': 'h'
};

/**
 * Transliterate single English word to Hindi (EN -> HI)
 */
export function transliterateWord(word: string): string {
    if (!word) return '';
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!cleanWord) return word;

    if (NAME_DICTIONARY[cleanWord]) {
        return NAME_DICTIONARY[cleanWord];
    }

    let res = cleanWord;
    for (const [pattern, rep] of MULTI_CHAR_MAP) {
        res = res.replace(pattern, rep);
    }

    let out = '';
    for (let i = 0; i < res.length; i++) {
        const ch = res[i];
        if (SINGLE_CHAR_MAP[ch]) {
            out += SINGLE_CHAR_MAP[ch];
        } else {
            out += ch;
        }
    }
    return out;
}

export function transliterateToHindi(textEn: string): string {
    if (!textEn) return '';
    if (/[\u0900-\u097F]/.test(textEn)) return textEn; // Already Hindi

    const words = textEn.split(/\s+/);
    return words.map(w => transliterateWord(w)).join(' ');
}

/**
 * Reverse Transliteration: Hindi -> English (HI -> EN)
 * Clean, robust phonetic Devanagari to Roman converter.
 */
export function transliterateToEnglish(textHi: string): string {
    if (!textHi) return '';
    // Strip non-Devanagari characters except spaces
    const cleanInput = textHi.trim();
    if (!/[\u0900-\u097F]/.test(cleanInput)) return cleanInput; // Already English

    const words = cleanInput.split(/\s+/);
    const converted = words.map(word => {
        // Strip symbols but keep Hindi letters
        const cleanWord = word.replace(/[^\u0900-\u097F]/g, '');
        if (!cleanWord) return word;

        if (REVERSE_DICTIONARY[cleanWord]) {
            return REVERSE_DICTIONARY[cleanWord];
        }

        let roman = '';
        let len = cleanWord.length;

        for (let i = 0; i < len; i++) {
            const ch = cleanWord[i];

            // 1. Check Independent Vowel
            if (VOWEL_MAP[ch]) {
                roman += VOWEL_MAP[ch];
                continue;
            }

            // 2. Check Consonant
            if (CONSONANT_MAP[ch]) {
                const baseCons = CONSONANT_MAP[ch];
                const nextCh = i + 1 < len ? cleanWord[i + 1] : '';

                if (nextCh === '्') { // Halant: suppress inherent vowel 'a'
                    roman += baseCons;
                    i++; // skip Halant
                } else if (MATRA_MAP[nextCh]) { // Matra: append Matra sound
                    roman += baseCons + MATRA_MAP[nextCh];
                    i++; // skip Matra
                } else if (i === len - 1) { // Word-final consonant: suppress trailing 'a' in Hindi
                    roman += baseCons;
                } else { // Intervening consonant: append inherent 'a'
                    roman += baseCons + 'a';
                }
                continue;
            }

            // 3. Check Standalone Matra or Anusvara
            if (MATRA_MAP[ch]) {
                roman += MATRA_MAP[ch];
                continue;
            }

            // Ignore raw Halant or unmapped Devanagari diacritics
            if (ch === '्' || ch === '़') continue;
        }

        if (roman.length > 0) {
            roman = roman.charAt(0).toUpperCase() + roman.slice(1).toLowerCase();
        }
        return roman || word;
    });

    return converted.join(' ');
}
