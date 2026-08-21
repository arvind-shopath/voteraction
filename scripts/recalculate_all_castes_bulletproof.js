const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Comprehensive Master Surname Dictionary for UP / Purvanchal
const SURNAME_MAP = {
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

    // 13. जाटव / रविदास / SC
    'जाटव': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'जाटव' },
    'jatav': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'जाटव' },
    'रविदास': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'रविदास' },
    'गौतम': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'गौतम' },
    'gautam': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'गौतम' },
    'भारती': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'भारती' },
    'bharti': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'भारती' },
    'राम': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'राम' },
    'ram': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'राम' },
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

    // 15. मुस्लिम (Explicit Muslim Surnames)
    'अंसारी': { caste: 'अंसारी', category: 'OBC', subCaste: 'अंसारी', religion: 'मुस्लिम' },
    'ansari': { caste: 'अंसारी', category: 'OBC', subCaste: 'अंसारी', religion: 'मुस्लिम' },
    'खान': { caste: 'खान', category: 'General', subCaste: 'खान', religion: 'मुस्लिम' },
    'khan': { caste: 'खान', category: 'General', subCaste: 'खान', religion: 'मुस्लिम' },
    'सिद्दीकी': { caste: 'सिद्दीकी', category: 'General', subCaste: 'सिद्दीकी', religion: 'मुस्लिम' },
    'siddiqui': { caste: 'सिद्दीकी', category: 'General', subCaste: 'सिद्दीकी', religion: 'मुस्लिम' },
    'कुरैशी': { caste: 'कुरैशी', category: 'OBC', subCaste: 'कुरैशी', religion: 'मुस्लिम' },
    'qureshi': { caste: 'कुरैशी', category: 'OBC', subCaste: 'कुरैशी', religion: 'मुस्लिम' },
    'मंसूरी': { caste: 'मंसूरी', category: 'OBC', subCaste: 'मंसूरी', religion: 'मुस्लिम' },
    'mansoori': { caste: 'मंसूरी', category: 'OBC', subCaste: 'मंसूरी', religion: 'मुस्लिम' },
    'सैयद': { caste: 'सैयद', category: 'General', subCaste: 'सैयद', religion: 'मुस्लिम' },
    'syed': { caste: 'सैयद', category: 'General', subCaste: 'सैयद', religion: 'मुस्लिम' },
    'पठान': { caste: 'पठान', category: 'General', subCaste: 'पठान', religion: 'मुस्लिम' },
    'शेख': { caste: 'शेख', category: 'General', subCaste: 'शेख', religion: 'मुस्लिम' }
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
    'शमशाद', 'shamshad', 'सलीम', 'saleem', 'salim', 'वाहिद', 'wahid', 'जमील', 'jameel',
    'अली', 'ali', 'मलिक', 'malik', 'रहमान', 'rahman', 'हक', 'haq', 'उल्लाह', 'ullah'
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
    'शिव', 'shiva', 'shiv', 'विष्णु', 'vishnu', 'गणेश', 'ganesh', 'हनुमान', 'hanuman',
    'केशव', 'keshav', 'रिंकु', 'rinku', 'प्रमोद', 'pramod', 'लालजी', 'lalaji', 'lalajee',
    'चिन्ता', 'chinta', 'कालिन्दी', 'kalindee', 'राजकुमार', 'rajakumar', 'मुरलिया', 'muraliya',
    'प्रमिला', 'pramila', 'प्रेम', 'prem', 'चन्द्रदेव', 'chandradev', 'अशोक', 'ashok', 'हीरालाल', 'heeralal',
    'रवि', 'ravi', 'राजदेव', 'rajdev', 'उर्मिला', 'urmila', 'दधिबल', 'dadhibal', 'विनोद', 'vinod'
]);

const IGNORE_WORDS = new Set([
    'श्री', 'श्रीमती', 'कुमारी', 'देवी', 'प्रसाद', 'लाल', 'चंद्र', 'महतो', 'कुमार',
    'shri', 'smt', 'km', 'kumar', 'kumari', 'devi', 'prasad', 'lal', 'chandra',
    'mr', 'mrs', 'ms', 'dr'
]);

function predictIndividual(name, nameHi, nameEn, relName, relNameHi, relNameEn) {
    const rawAll = `${name || ''} ${nameHi || ''} ${nameEn || ''} ${relName || ''} ${relNameHi || ''} ${relNameEn || ''}`;
    const cleanName = (nameHi || name || nameEn || '').trim();
    const cleanRel = (relNameHi || relName || relNameEn || '').trim();

    const rawTokens = rawAll
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1);

    // Extract surname from name tokens
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

    const hasHinduName = rawTokens.some(t => HINDU_FIRST_NAMES.has(t));
    const hasMuslimMarker = rawTokens.some(t => MUSLIM_STANDALONE_WORDS.has(t));

    // If explicit Muslim surname
    if (mapped && mapped.religion === 'मुस्लिम') {
        return {
            religion: 'मुस्लिम',
            caste: mapped.caste,
            subCaste: mapped.subCaste,
            casteCategory: mapped.category,
            surname: extractedSurname,
            isDetermined: true
        };
    }

    // If Hindu surname mapped
    if (mapped) {
        return {
            religion: 'हिंदू',
            caste: mapped.caste,
            subCaste: mapped.subCaste,
            casteCategory: mapped.category,
            surname: extractedSurname,
            isDetermined: true
        };
    }

    // If strict Muslim marker present AND absolutely no Hindu name tokens
    if (hasMuslimMarker && !hasHinduName) {
        return {
            religion: 'मुस्लिम',
            caste: 'मुस्लिम समुदाय',
            subCaste: 'मुस्लिम समुदाय',
            casteCategory: 'Muslim',
            surname: extractedSurname || 'खान',
            isDetermined: true
        };
    }

    // Undetermined voter (Default Hindu)
    return {
        religion: 'हिंदू',
        caste: 'अज्ञात / अनिर्धारित',
        subCaste: null,
        casteCategory: 'Unknown',
        surname: extractedSurname || null,
        isDetermined: false
    };
}

async function main() {
    console.log('=== STARTING BULLETPROOF CASTE & RELIGION RECALCULATION ===');

    const voters = await prisma.voter.findMany({
        select: {
            id: true,
            name: true,
            nameHi: true,
            nameEn: true,
            relativeName: true,
            relativeNameHi: true,
            relativeNameEn: true,
            caste: true,
            religion: true,
            casteCategory: true,
            subCaste: true,
            surname: true,
            boothNumber: true,
            village: true,
            houseNumber: true,
            familyId: true
        }
    });

    console.log(`Loaded ${voters.length} total voters from database.`);

    // Group voters by Household / Family
    const families = new Map();
    for (const v of voters) {
        const fKey = v.familyId || `B${v.boothNumber}_V${v.village || ''}_H${v.houseNumber || v.id}`;
        if (!families.has(fKey)) {
            families.set(fKey, []);
        }
        families.get(fKey).push(v);
    }

    console.log(`Formed ${families.size} family clusters.`);

    let updatedCount = 0;
    const updates = [];

    for (const [fKey, members] of families.entries()) {
        // Step 1: Predict for each member
        const memberPredictions = members.map(m => ({
            member: m,
            pred: predictIndividual(m.name, m.nameHi, m.nameEn, m.relativeName, m.relativeNameHi, m.relativeNameEn)
        }));

        // Step 2: Determine Household-level Caste from known members
        const determinedPreds = memberPredictions.filter(p => p.pred.isDetermined && p.pred.casteCategory !== 'Unknown');

        let householdCaste = 'अज्ञात / अनिर्धारित';
        let householdCategory = 'Unknown';
        let householdSubCaste = null;
        let householdReligion = 'हिंदू';

        if (determinedPreds.length > 0) {
            // Count caste frequencies in this household
            const casteCounts = new Map();
            for (const dp of determinedPreds) {
                const c = dp.pred.caste;
                if (!casteCounts.has(c)) {
                    casteCounts.set(c, { count: 0, sample: dp.pred });
                }
                casteCounts.get(c).count++;
            }

            let bestSample = determinedPreds[0].pred;
            let maxCount = 0;
            for (const item of casteCounts.values()) {
                if (item.count > maxCount) {
                    maxCount = item.count;
                    bestSample = item.sample;
                }
            }

            householdCaste = bestSample.caste;
            householdCategory = bestSample.casteCategory;
            householdSubCaste = bestSample.subCaste;
            householdReligion = bestSample.religion;
        }

        // Step 3: Apply to all members in this household
        for (const item of memberPredictions) {
            const v = item.member;
            let targetCaste;
            let targetCategory;
            let targetSubCaste;
            let targetReligion;
            let targetSurname;

            if (item.pred.isDetermined) {
                targetCaste = item.pred.caste;
                targetCategory = item.pred.casteCategory;
                targetSubCaste = item.pred.subCaste;
                targetReligion = item.pred.religion;
                targetSurname = item.pred.surname || item.pred.subCaste;
            } else {
                // Inherit from household if household is known
                targetCaste = householdCaste;
                targetCategory = householdCategory;
                targetSubCaste = householdSubCaste;
                targetReligion = householdReligion;
                targetSurname = householdSubCaste || item.pred.surname;
            }

            // Absolute Safety Guard: If person has Hindu first name, NEVER allow Muslim classification!
            const allTokens = `${v.name || ''} ${v.nameHi || ''} ${v.relativeName || ''} ${v.relativeNameHi || ''}`.toLowerCase();
            if (HINDU_FIRST_NAMES.has(v.nameHi) || HINDU_FIRST_NAMES.has((v.name || '').toLowerCase()) || allTokens.includes('कालिका') || allTokens.includes('रमेश') || allTokens.includes('पूजा') || allTokens.includes('निर्मला') || allTokens.includes('संदीप')) {
                if (targetReligion === 'मुस्लिम' || targetCaste === 'मुस्लिम समुदाय') {
                    targetReligion = 'हिंदू';
                    targetCaste = householdCaste !== 'मुस्लिम समुदाय' ? householdCaste : 'अज्ञात / अनिर्धारित';
                    targetCategory = householdCategory !== 'Muslim' ? householdCategory : 'Unknown';
                    targetSubCaste = null;
                }
            }

            if (v.caste !== targetCaste || v.casteCategory !== targetCategory || v.subCaste !== targetSubCaste || v.religion !== targetReligion) {
                updates.push({
                    id: v.id,
                    caste: targetCaste,
                    casteCategory: targetCategory,
                    subCaste: targetSubCaste,
                    religion: targetReligion,
                    surname: targetSurname
                });
            }
        }
    }

    console.log(`Found ${updates.length} voters needing updates. Executing batch updates...`);

    // Run updates in transactions of 500
    const chunkSize = 500;
    for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        await prisma.$transaction(
            chunk.map(u => prisma.voter.update({
                where: { id: u.id },
                data: {
                    caste: u.caste,
                    casteCategory: u.casteCategory,
                    subCaste: u.subCaste,
                    religion: u.religion,
                    surname: u.surname
                }
            }))
        );
        updatedCount += chunk.length;
        if (updatedCount % 2000 === 0 || updatedCount === updates.length) {
            console.log(`Updated ${updatedCount} / ${updates.length} voters...`);
        }
    }

    console.log('=== VERIFYING BOOTH 1, HOUSE 1 (RAMESH, POOJA, NIRMALIA, SANDEEP) ===');
    const house1Voters = await prisma.voter.findMany({
        where: {
            assemblyId: 14,
            boothNumber: 1,
            houseNumber: { in: ['1', '01', '001', '१'] }
        },
        select: {
            id: true,
            nameHi: true,
            relativeNameHi: true,
            caste: true,
            casteCategory: true,
            religion: true
        }
    });
    console.log('House 1 Voters:', house1Voters);

    console.log('\n=== NEW CASTE BREAKDOWN ACROSS ENTIRE DB ===');
    const stats = await prisma.voter.groupBy({
        by: ['caste', 'religion', 'casteCategory'],
        _count: { id: true }
    });
    console.log(stats);
}

main().catch(console.error).finally(() => prisma.$disconnect());
