/**
 * Module 6: Caste & Religion Prediction Engine (Comprehensive UP / Purvanchal Engine)
 * 
 * Provides robust, word-boundary aware inference for Religion, Caste, and Caste Category
 * using a Master Surname Dictionary, Hindu Name Whitelist, and Strict Muslim Word Tokens.
 */

export interface PredictionResult {
    religion: string;
    caste: string;
    subCaste?: string;
    casteCategory: 'General' | 'OBC' | 'SC' | 'ST' | 'Other';
    surname: string;
}

// Master Surname Dictionary
export const SURNAME_MAP: Record<string, { caste: string; category: 'General' | 'OBC' | 'SC' | 'ST'; subCaste?: string }> = {
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
    'दुबे': { caste: 'ब्राह्मण', category: 'General', subCaste: 'दूबे' },
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
    'दीक्षित': { caste: 'ब्राह्मण', category: 'General', subCaste: 'दीक्षित' },
    'त्यागी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'त्यागी' },
    'झा': { caste: 'ब्राह्मण', category: 'General', subCaste: 'झा' },
    'ओझा': { caste: 'ब्राह्मण', category: 'General', subCaste: 'ओझा' },

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
    'सोलंकी': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'सोलंकी' },
    'तोमर': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'तोमर' },
    'रघुवंशी': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'रघुवंशी' },
    'बघेल': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'बघेल' },

    // 3. कायस्थ / लाला (General)
    'कायस्थ': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'कायस्थ' },
    'kayastha': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'कायस्थ' },
    'लाला': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'लाला' },
    'श्रीवास्तव': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'श्रीवास्तव' },
    'shrivastava': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'श्रीवास्तव' },
    'srivastava': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'श्रीवास्तव' },
    'सक्सेना': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'सक्सेना' },
    'निगम': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'निगम' },
    'माथुर': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'माथुर' },
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
    'जायसवाल': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'जायसवाल' },
    'jaiswal': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'जायसवाल' },
    'चौरसिया': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'चौरसिया' },
    'chaurasia': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'चौरसिया' },
    'केसरी': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'केसरी' },
    'साहू': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'साहू' },
    'sahu': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'साहू' },

    // 5. यादव / अहीर (OBC)
    'यादव': { caste: 'यादव', category: 'OBC', subCaste: 'यादव' },
    'yadav': { caste: 'यादव', category: 'OBC', subCaste: 'यादव' },
    'अहीर': { caste: 'यादव', category: 'OBC', subCaste: 'अहीर' },

    // 6. कुर्मि / पटेल (OBC)
    'कुर्मी': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'कुर्मी' },
    'kurmi': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'कुर्मी' },
    'पटेल': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'पटेल' },
    'patel': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'पटेल' },
    'वर्मा': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'वर्मा' },
    'verma': { caste: 'कुर्मी/पटेल', category: 'OBC', subCaste: 'वर्मा' },

    // 7. मौर्य / कुशवाहा / सैनी / शाक्य (OBC)
    'मौर्य': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'मौर्य' },
    'maurya': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'मौर्य' },
    'कुशवाहा': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'कुशवाहा' },
    'kushwaha': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'कुशवाहा' },
    'सैनी': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'सैनी' },
    'शाक्य': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'शाक्य' },

    // 8. राजभर (OBC)
    'राजभर': { caste: 'राजभर', category: 'OBC', subCaste: 'राजभर' },
    'rajbhar': { caste: 'राजभर', category: 'OBC', subCaste: 'राजभर' },

    // 9. बिंद / निषाद / मल्लाह / कश्यप (OBC)
    'बिंद': { caste: 'बिंद', category: 'OBC', subCaste: 'बिंद' },
    'bind': { caste: 'बिंद', category: 'OBC', subCaste: 'बिंद' },
    'निषाद': { caste: 'कश्यप/निषाद', category: 'OBC', subCaste: 'निषाद' },
    'nishad': { caste: 'कश्यप/निषाद', category: 'OBC', subCaste: 'निषाद' },
    'मल्लाह': { caste: 'कश्यप/निषाद', category: 'OBC', subCaste: 'मल्लाह' },
    'कश्यप': { caste: 'कश्यप/निषाद', category: 'OBC', subCaste: 'कश्यप' },
    'kashyap': { caste: 'कश्यप/निषाद', category: 'OBC', subCaste: 'कश्यप' },

    // 10. प्रजापति / कुम्हार (OBC)
    'प्रजापति': { caste: 'प्रजापति/कुम्हार', category: 'OBC', subCaste: 'प्रजापति' },
    'prajapati': { caste: 'प्रजापति/कुम्हार', category: 'OBC', subCaste: 'प्रजापति' },
    'कुम्हार': { caste: 'प्रजापति/कुम्हार', category: 'OBC', subCaste: 'कुम्हार' },

    // 11. विश्वकर्मा / बढ़ई / लोहार (OBC)
    'विश्वकर्मा': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'विश्वकर्मा' },
    'vishwakarma': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'विश्वकर्मा' },
    'लोहार': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'लोहार' },
    'बढ़ई': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'बढ़ई' },

    // 12. पाल / बघेल (OBC)
    'पाल': { caste: 'पाल/बघेल', category: 'OBC', subCaste: 'पाल' },
    'pal': { caste: 'पाल/बघेल', category: 'OBC', subCaste: 'पाल' },
    'गडरिया': { caste: 'पाल/बघेल', category: 'OBC', subCaste: 'गडरिया' },

    // 13. जाटव / चमार / अनुसूचित जाति (SC)
    'राम': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'राम' },
    'ram': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'राम' },
    'जाटव': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'जाटव' },
    'jatav': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'जाटव' },
    'चमार': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'चमार' },
    'भारती': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'भारती' },
    'bharti': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'भारती' },
    'गौतम': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'गौतम' },
    'gautam': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'गौतम' },
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

    // 14. ST
    'मीणा': { caste: 'मीणा', category: 'ST', subCaste: 'मीणा' },
    'गोंड': { caste: 'गोंड', category: 'ST', subCaste: 'गोंड' },
    'खरवार': { caste: 'खरवार', category: 'ST', subCaste: 'खरवार' },

    // 15. मुस्लिम
    'अंसारी': { caste: 'अंसारी', category: 'OBC', subCaste: 'अंसारी' },
    'ansari': { caste: 'अंसारी', category: 'OBC', subCaste: 'अंसारी' },
    'खान': { caste: 'खान', category: 'General', subCaste: 'खान' },
    'khan': { caste: 'खान', category: 'General', subCaste: 'खान' },
    'सिद्दीकी': { caste: 'सिद्दीकी', category: 'General', subCaste: 'सिद्दीकी' },
    'siddiqui': { caste: 'सिद्दीकी', category: 'General', subCaste: 'सिद्दीकी' },
    'कुरैशी': { caste: 'कुरैशी', category: 'OBC', subCaste: 'कुरैशी' },
    'qureshi': { caste: 'कुरैशी', category: 'OBC', subCaste: 'कुरैशी' },
    'मंसूरी': { caste: 'मंसूरी', category: 'OBC', subCaste: 'मंसूरी' },
    'mansoori': { caste: 'मंसूरी', category: 'OBC', subCaste: 'मंसूरी' },
    'सैयद': { caste: 'सैयद', category: 'General', subCaste: 'सैयद' },
    'syed': { caste: 'सैयद', category: 'General', subCaste: 'सैयद' },
    'पठान': { caste: 'पठान', category: 'General', subCaste: 'पठान' },
    'शेख': { caste: 'शेख', category: 'General', subCaste: 'शेख' }
};

// Strict Standalone Muslim Word Tokens
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

const CHRISTIAN_STANDALONE_WORDS = new Set([
    'मसीह', 'masih', 'जॉसफ', 'joseph', 'डिसूज़ा', "d'souza", 'dsouza', 'पीटर', 'peter', 'जॉन', 'john', 'पॉल', 'paul'
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
    'श्री', 'श्रीमती', 'कुमारी', 'देवी', 'प्रसाद', 'लाल', 'चंद्र', 'महतो',
    'shri', 'smt', 'km', 'kumar', 'kumari', 'devi', 'prasad', 'lal', 'chandra',
    'mr', 'mrs', 'ms', 'dr'
]);

export function predictVoterAttributes(name: string, relativeName?: string): PredictionResult {
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

    let hasChristianMarker = false;
    for (const t of rawTokens) {
        if (CHRISTIAN_STANDALONE_WORDS.has(t)) {
            hasChristianMarker = true;
            break;
        }
    }

    let religion = 'हिंदू';
    if (hasMuslimMarker && !hasHinduName) {
        religion = 'मुस्लिम';
    } else if (hasChristianMarker && !hasHinduName) {
        religion = 'ईसाई';
    } else {
        religion = 'हिंदू';
    }

    if (mapped) {
        const isMuslim = mapped.caste === 'खान' || mapped.caste === 'अंसारी' || mapped.caste === 'सिद्दीकी' || mapped.caste === 'कुरैशी' || mapped.caste === 'मंसूरी' || mapped.caste === 'सैयद' || mapped.caste === 'पठान' || mapped.caste === 'शेख' || mapped.caste === 'मुस्लिम समुदाय';
        return {
            religion: isMuslim ? 'मुस्लिम' : 'हिंदू',
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
            casteCategory: 'Muslim',
            surname: extractedSurname || 'खान'
        };
    }

    // Undetermined voters are classified as Unknown / अज्ञात
    return {
        religion: 'हिंदू',
        caste: 'अज्ञात / अनिर्धारित',
        casteCategory: 'Unknown',
        subCaste: undefined,
        surname: extractedSurname || undefined
    };
}
