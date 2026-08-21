const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SURNAME_MAP = {
    // 1. ब्राह्मण (General)
    'ब्राह्मण': { caste: 'ब्राह्मण', category: 'General', subCaste: 'ब्राह्मण' },
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
    'चतुर्वेदी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'चतुर्वेदी' },
    'पाठक': { caste: 'ब्राह्मण', category: 'General', subCaste: 'पाठक' },
    'pathak': { caste: 'ब्राह्मण', category: 'General', subCaste: 'पाठक' },
    'जोशी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'जोशी' },
    'दीक्षित': { caste: 'ब्राह्मण', category: 'General', subCaste: 'दीक्षित' },
    'झा': { caste: 'ब्राह्मण', category: 'General', subCaste: 'झा' },
    'ओझा': { caste: 'ब्राह्मण', category: 'General', subCaste: 'ओझा' },
    'शास्त्री': { caste: 'ब्राह्मण', category: 'General', subCaste: 'शास्त्री' },
    'अवस्थी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'अवस्थी' },
    'बाजपेयी': { caste: 'ब्राह्मण', category: 'General', subCaste: 'बाजपेयी' },

    // 2. भूमिहार (General)
    'राय': { caste: 'भूमिहार', category: 'General', subCaste: 'राय' },
    'rai': { caste: 'भूमिहार', category: 'General', subCaste: 'राय' },
    'त्यागी': { caste: 'भूमिहार', category: 'General', subCaste: 'त्यागी' },
    'भूमिहार': { caste: 'भूमिहार', category: 'General', subCaste: 'भूमिहार' },
    'शाही': { caste: 'भूमिहार', category: 'General', subCaste: 'शाही' },

    // 3. क्षत्रिय / राजपूत (General)
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
    'बघेल_ठाकुर': { caste: 'क्षत्रिय/राजपूत', category: 'General', subCaste: 'बघेल' },

    // 4. कायस्थ (General)
    'कायस्थ': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'कायस्थ' },
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
    'सिन्हा': { caste: 'कायस्थ/लाला', category: 'General', subCaste: 'सिन्हा' },

    // 5. वैश्य / बनिया (General)
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
    'केसरी': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'केसरी' },
    'साहू': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'साहू' },
    'sahu': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'साहू' },
    'मोदनवाल': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'मोदनवाल' },
    'बरनवाल': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'बरनवाल' },
    'कसौधन': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'कसौधन' },
    'रस्तोगी': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'रस्तोगी' },
    'पटवा': { caste: 'वैश्य/बनिया', category: 'General', subCaste: 'पटवा' },

    // 6. ओबीसी (OBC)
    'यादव': { caste: 'यादव', category: 'OBC', subCaste: 'यादव' },
    'yadav': { caste: 'यादव', category: 'OBC', subCaste: 'यादव' },
    'अहीर': { caste: 'यादव', category: 'OBC', subCaste: 'अहीर' },
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
    'शाक्य': { caste: 'मौर्य/कुशवाहा', category: 'OBC', subCaste: 'शाक्य' },
    'राजभर': { caste: 'राजभर', category: 'OBC', subCaste: 'राजभर' },
    'rajbhar': { caste: 'राजभर', category: 'OBC', subCaste: 'राजभर' },
    'भर': { caste: 'राजभर', category: 'OBC', subCaste: 'भर' },
    'बिंद': { caste: 'बिंद', category: 'OBC', subCaste: 'बिंद' },
    'bind': { caste: 'बिंद', category: 'OBC', subCaste: 'बिंद' },
    'निषाद': { caste: 'कश्यप/निषाद', category: 'OBC', subCaste: 'निषाद' },
    'nishad': { caste: 'कश्यप/निषाद', category: 'OBC', subCaste: 'निषाद' },
    'मल्लाह': { caste: 'कश्यप/निषाद', category: 'OBC', subCaste: 'मल्लाह' },
    'कश्यप': { caste: 'कश्यप/निषाद', category: 'OBC', subCaste: 'कश्यप' },
    'kashyap': { caste: 'कश्यप/निषाद', category: 'OBC', subCaste: 'कश्यप' },
    'केवट': { caste: 'कश्यप/निषाद', category: 'OBC', subCaste: 'केवट' },
    'साहनी': { caste: 'कश्यप/निषाद', category: 'OBC', subCaste: 'साहनी' },
    'प्रजापति': { caste: 'प्रजापति/कुम्हार', category: 'OBC', subCaste: 'प्रजापति' },
    'prajapati': { caste: 'प्रजापति/कुम्हार', category: 'OBC', subCaste: 'प्रजापति' },
    'कुम्हार': { caste: 'प्रजापति/कुम्हार', category: 'OBC', subCaste: 'कुम्हार' },
    'विश्वकर्मा': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'विश्वकर्मा' },
    'vishwakarma': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'विश्वकर्मा' },
    'लोहार': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'लोहार' },
    'बढ़ई': { caste: 'विश्वकर्मा', category: 'OBC', subCaste: 'बढ़ई' },
    'पाल': { caste: 'पाल/बघेल', category: 'OBC', subCaste: 'पाल' },
    'pal': { caste: 'पाल/बघेल', category: 'OBC', subCaste: 'पाल' },
    'गडरिया': { caste: 'पाल/बघेल', category: 'OBC', subCaste: 'गडरिया' },
    'बघेल': { caste: 'पाल/बघेल', category: 'OBC', subCaste: 'बघेल' },

    // 7. एससी (SC)
    'राम': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'राम' },
    'ram': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'राम' },
    'जाटव': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'जाटव' },
    'jatav': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'जाटव' },
    'चमार': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'चमार' },
    'रविदास': { caste: 'जाटव/रविदास', category: 'SC', subCaste: 'रविदास' },
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

    // 8. एसटी (ST)
    'मीणा': { caste: 'मीणा', category: 'ST', subCaste: 'मीणा' },
    'गोंड': { caste: 'गोंड', category: 'ST', subCaste: 'गोंड' },
    'खरवार': { caste: 'खरवार', category: 'ST', subCaste: 'खरवार' },

    // 9. मुस्लिम (Muslim)
    'अंसारी': { caste: 'अंसारी', category: 'Muslim', subCaste: 'अंसारी' },
    'ansari': { caste: 'अंसारी', category: 'Muslim', subCaste: 'अंसारी' },
    'खान': { caste: 'खान', category: 'Muslim', subCaste: 'खान' },
    'khan': { caste: 'खान', category: 'Muslim', subCaste: 'खान' },
    'सिद्दीकी': { caste: 'सिद्दीकी', category: 'Muslim', subCaste: 'सिद्दीकी' },
    'siddiqui': { caste: 'सिद्दीकी', category: 'Muslim', subCaste: 'सिद्दीकी' },
    'कुरैशी': { caste: 'कुरैशी', category: 'Muslim', subCaste: 'कुरैशी' },
    'qureshi': { caste: 'कुरैशी', category: 'Muslim', subCaste: 'कुरैशी' },
    'मंसूरी': { caste: 'मंसूरी', category: 'Muslim', subCaste: 'मंसूरी' },
    'mansoori': { caste: 'मंसूरी', category: 'Muslim', subCaste: 'मंसूरी' },
    'सैयद': { caste: 'सैयद', category: 'Muslim', subCaste: 'सैयद' },
    'syed': { caste: 'सैयद', category: 'Muslim', subCaste: 'सैयद' },
    'पठान': { caste: 'पठान', category: 'Muslim', subCaste: 'पठान' },
    'शेख': { caste: 'शेख', category: 'Muslim', subCaste: 'शेख' }
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
    'नेहा', 'neha', 'पूनम', 'poonam', 'संगीता', 'sangeeta', 'कृष्ण', 'krishna',
    'शिव', 'shiva', 'shiv', 'विष्णु', 'vishnu', 'गणेश', 'ganesh', 'हनुमान', 'hanuman'
]);

const IGNORE_WORDS = new Set([
    'श्री', 'श्रीमती', 'कुमारी', 'देवी', 'प्रसाद', 'लाल', 'चंद्र', 'महतो',
    'shri', 'smt', 'km', 'kumar', 'kumari', 'devi', 'prasad', 'lal', 'chandra',
    'mr', 'mrs', 'ms', 'dr'
]);

function predictIndividual(name, relativeName) {
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
        const isMuslim = mapped.category === 'Muslim';
        return {
            religion: isMuslim ? 'मुस्लिम' : 'हिंदू',
            caste: mapped.caste,
            subCaste: mapped.subCaste,
            casteCategory: mapped.category,
            surname: extractedSurname,
            isDetermined: true
        };
    }

    if (religion === 'मुस्लिम') {
        return {
            religion: 'मुस्लिम',
            caste: 'मुस्लिम समुदाय',
            casteCategory: 'Muslim',
            surname: extractedSurname || 'खान',
            isDetermined: true
        };
    }

    return {
        religion: 'हिंदू',
        caste: 'अज्ञात / अनिर्धारित',
        casteCategory: 'Unknown',
        subCaste: null,
        surname: extractedSurname || null,
        isDetermined: false
    };
}

async function run() {
    console.log('Fetching all voters and applying Family-Level Caste Propagation...');
    const voters = await prisma.voter.findMany({
        select: { 
            id: true, 
            name: true, 
            relativeName: true, 
            caste: true, 
            religion: true, 
            casteCategory: true, 
            subCaste: true, 
            surname: true,
            boothNumber: true,
            village: true,
            houseNumber: true,
            houseNoClean: true,
            householdId: true
        }
    });

    console.log(`Analyzing ${voters.length} voters...`);

    // 1. Group voters by Family / Household
    const familyGroups = new Map();

    for (const v of voters) {
        const bNum = v.boothNumber || 1;
        const vil = (v.village || 'सामान्य').trim();
        const hNo = (v.houseNoClean || v.houseNumber || '0').trim();
        const familyKey = v.householdId ? `hh_${v.householdId}` : `b_${bNum}_v_${vil}_h_${hNo}`;

        if (!familyGroups.has(familyKey)) {
            familyGroups.set(familyKey, []);
        }
        familyGroups.get(familyKey).push(v);
    }

    console.log(`Found ${familyGroups.size} unique family/household clusters.`);

    let updatedCount = 0;

    for (const [fKey, members] of familyGroups.entries()) {
        // Step 1: Predict for each member
        const predictions = members.map(m => ({
            member: m,
            pred: predictIndividual(m.name, m.relativeName)
        }));

        // Step 2: Check if ANY family member has a determined caste
        const determinedPreds = predictions.filter(p => p.pred.isDetermined && p.pred.casteCategory !== 'Unknown');

        let familyCaste = 'अज्ञात / अनिर्धारित';
        let familyCategory = 'Unknown';
        let familySubCaste = null;
        let familyReligion = 'हिंदू';

        if (determinedPreds.length > 0) {
            // Find most frequent caste in this household
            const casteCounts = new Map();
            for (const dp of determinedPreds) {
                const cName = dp.pred.caste;
                if (!casteCounts.has(cName)) {
                    casteCounts.set(cName, { count: 0, sample: dp.pred });
                }
                casteCounts.get(cName).count++;
            }

            let bestSample = determinedPreds[0].pred;
            let maxCount = 0;
            for (const item of casteCounts.values()) {
                if (item.count > maxCount) {
                    maxCount = item.count;
                    bestSample = item.sample;
                }
            }

            familyCaste = bestSample.caste;
            familyCategory = bestSample.casteCategory;
            familySubCaste = bestSample.subCaste;
            familyReligion = bestSample.religion;
        } else {
            // Check if any member has Muslim marker
            const muslimMember = predictions.find(p => p.pred.religion === 'मुस्लिम');
            if (muslimMember) {
                familyReligion = 'मुस्लिम';
                familyCategory = 'Muslim';
                familyCaste = 'मुस्लिम समुदाय';
            }
        }

        // Step 3: Apply Family Caste to all members
        for (const item of predictions) {
            const v = item.member;
            const targetCaste = item.pred.isDetermined ? item.pred.caste : familyCaste;
            const targetCategory = item.pred.isDetermined ? item.pred.casteCategory : familyCategory;
            const targetSubCaste = item.pred.isDetermined ? item.pred.subCaste : familySubCaste;
            const targetReligion = item.pred.isDetermined ? item.pred.religion : familyReligion;
            const targetSurname = item.pred.surname || (familySubCaste || null);

            if (v.caste !== targetCaste || v.casteCategory !== targetCategory || v.subCaste !== targetSubCaste || v.religion !== targetReligion) {
                await prisma.voter.update({
                    where: { id: v.id },
                    data: {
                        caste: targetCaste,
                        casteCategory: targetCategory,
                        subCaste: targetSubCaste,
                        religion: targetReligion,
                        surname: targetSurname
                    }
                });
                updatedCount++;
            }
        }
    }

    console.log(`Successfully updated ${updatedCount} voters with Family-Level Caste Propagation!`);

    const categories = await prisma.voter.groupBy({
        by: ['casteCategory'],
        _count: { id: true }
    });
    console.log('Updated Categories Summary:', categories);

    const topCastes = await prisma.voter.groupBy({
        by: ['caste'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
    });
    console.log('Top Castes:', topCastes.slice(0, 15));
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
