# VoterAction — Candidate Dashboard
## Project Document / Product Specification

**Project:** VoterAction  
**Module:** Candidate Dashboard / Command Center  
**User:** Candidate  
**Purpose:** चुनावी अभियान की वर्तमान स्थिति को एक ही स्क्रीन पर समझना और आवश्यक कार्रवाई तक तुरंत पहुँचना।

---

## 1. Project Objective

Candidate के login करने के बाद उसे अलग-अलग modules खोलकर जानकारी खोजने की जरूरत न पड़े।

Dashboard का उद्देश्य है कि candidate को **30–60 सेकंड में** यह स्पष्ट हो जाए:

1. चुनावी तैयारी की वर्तमान स्थिति क्या है?
2. आज campaign में क्या हो रहा है?
3. कितने households cover हुए हैं?
4. कौन से booths अच्छी स्थिति में हैं?
5. किन booths पर ध्यान देना है?
6. field team कितना काम कर रही है?
7. कौन से events आने वाले हैं?
8. कौन से tasks pending हैं?
9. कौन से operational issues तुरंत देखने हैं?
10. विस्तृत जानकारी कहाँ से खोलनी है?

**Dashboard को "Command Center" की तरह बनाया जाएगा, न कि एक भारी analytics/reporting page की तरह।**

---

# 2. Dashboard का मुख्य सिद्धांत

Dashboard पर केवल वही information होगी जिस पर candidate को **जानकारी या कार्रवाई** चाहिए।

Detailed information अलग-अलग modules में रहेगी।

### Dashboard का flow:

**Overall स्थिति → आज की स्थिति → Field Coverage → Booth स्थिति → Events → Team → Issues → Election Readiness**

---

# 3. Dashboard का प्रस्तावित क्रम

## Section 1 — Candidate & Constituency Header

Dashboard के सबसे ऊपर:

- Candidate name
- Constituency name/number
- Current campaign phase
- Last data update
- Notifications
- Profile
- Settings

### उदाहरण

**375 गाजीपुर सदर विधानसभा**  
अहमद अब्बासी  
**Current Phase: चुनाव प्रचार**

साथ में:

> Last updated: Today, 10:42 AM

---

# 4. Section 2 — Overall Election Readiness

यह Dashboard का **सबसे prominent section** होगा।

### उदाहरण

## चुनावी तैयारी

### **72%**

इसके साथ यह स्पष्ट होगा कि यह percentage किन वास्तविक metrics से बना है।

### Components

- Household Coverage — 68%
- Door-to-Door Visits — 61%
- Booth Team Assignment — 84%
- Campaign Events — 76%
- Task Completion — 73%
- Reporting Coverage — 69%

### साथ में Priority Summary

🔴 **Critical:** 3 Booths  
🟡 **Attention Required:** 7 Booths  
🟢 **On Track:** 18 Booths

### Action

**Campaign Progress देखें →**

यह button candidate को आपके अलग **Campaign Progress / Election Readiness** page पर ले जाएगा।

---

# 5. Readiness Score का नियम

यह score manually नहीं डाला जाएगा।

System वास्तविक operational data से इसे calculate करेगा।

उदाहरण:

| Metric | Weight |
|---|---:|
| Household Coverage | 25% |
| Door-to-Door Coverage | 25% |
| Booth Team Assignment | 15% |
| Campaign/Event Execution | 10% |
| Task Completion | 10% |
| Reporting Coverage | 15% |

**कुल = 100%**

Weights future में administrator द्वारा configurable रखे जा सकते हैं।

### महत्वपूर्ण

यदि किसी metric का data उपलब्ध नहीं है तो system उसे गलत तरीके से 0% नहीं मानेगा।

उसे:

**Not Available / Data Pending**

दिखाया जा सकता है।

---

# 6. Section 3 — आज की स्थिति

Overall readiness के बाद candidate को **आज का operational snapshot** मिलेगा।

### Cards

**आज के Events**  
3

**आज के Field Visits**  
486

**Active Workers**  
84

**Pending Tasks**  
27

**Revisit Required**  
85

---

## इसका उद्देश्य

Candidate को यह समझने में कोई मेहनत न करनी पड़े कि:

> **"आज campaign में क्या हो रहा है?"**

---

# 7. Section 4 — Household / Door-to-Door Coverage

यह VoterAction के मुख्य operational modules में से एक होगा।

### Dashboard पर दिखेगा:

**Total Households:** 10,000

**Visited:** 6,500

**Pending:** 3,500

**Revisit Required:** 850

साथ में:

### Coverage Progress

`████████████░░░░ 65%`

---

## Booth-wise छोटा summary

| Booth | Households | Visited | Pending | Status |
|---|---:|---:|---:|---|
| Booth 1 | 520 | 480 | 40 | 🟢 |
| Booth 2 | 610 | 390 | 220 | 🟡 |
| Booth 3 | 475 | 210 | 265 | 🔴 |

Dashboard पर केवल priority booths दिखेंगे।

### Action

**Household Tracking देखें →**

---

# 8. Section 5 — Map Snapshot

Dashboard पर पूरा map नहीं रखा जाएगा।

एक **small live map preview** होगा।

इसमें operational household mapping दिखाई जा सकती है:

- Booth boundaries
- Household locations
- Visit status
- Pending coverage
- Revisit status
- Field team activity

### Action

**पूरा Household Map खोलें →**

---

# 9. Section 6 — Booth Status

यह candidate के लिए अत्यंत महत्वपूर्ण section होगा।

### Summary

**Total Booths: 25**

🟢 Ready — 14  
🟡 Attention Required — 7  
🔴 Critical — 4

फिर केवल priority booths:

### उदाहरण

**Booth 7**  
Household coverage कम

**Booth 12**  
Team assignment incomplete

**Booth 18**  
Field reporting pending

---

### Action

**Booth Management देखें →**

---

# 10. Section 7 — Upcoming Campaign Events

Dashboard पर candidate को आने वाले महत्वपूर्ण कार्यक्रम दिखाई देंगे।

### उदाहरण

**आज**

### जनसभा
25 August | 5:00 PM  
Ward 12  
Responsible: X  
Expected Attendance: 500

---

**कल**

### कार्यकर्ता बैठक
26 August | 11:00 AM  
Booth 8

---

### Dashboard पर केवल summary होगी।

पूरी functionality अलग:

**Campaign / Event Management**

में रहेगी।

---

# 11. Section 8 — Field Team Status

Candidate को यह समझना चाहिए कि organisation ground पर कितनी active है।

### Summary

**Total Workers:** 120

**Active Today:** 84

**Assigned:** 105

**No Activity:** 15

### आज की Activity

- Visits completed
- Reports submitted
- Revisit requests
- Pending reports
- Unassigned households

### Action

**Worker Progress देखें →**

---

# 12. Section 9 — Tasks & Issues

यह section candidate dashboard में अनिवार्य होना चाहिए।

क्योंकि केवल statistics दिखाने से dashboard actionable नहीं बनेगा।

### Critical Issues

🔴 **8 Critical**

उदाहरण:

- Booth 4 — Team incomplete
- Booth 9 — Reporting pending
- Event — Responsible person missing

### Pending

🟡 **14 Pending**

- 8 tasks due today
- 6 overdue

---

### हर issue पर

**View / Resolve →**

---

# 13. Section 10 — Election Readiness

Election के करीब आने पर यह section अधिक महत्वपूर्ण होगा।

### Candidate को दिखे:

- Booth teams assigned
- Required responsibilities assigned
- Reporting setup status
- Outstanding operational issues
- Booths requiring attention

### Example

**Booth Team Readiness**

22 / 25 booths ready

**Reporting Readiness**

21 / 25 booths reporting

**Outstanding Issues**

7

---

# 14. Section 11 — Historical / Analytics Summary

Dashboard के सबसे नीचे सीमित historical information होगी।

उदाहरण:

- Previous election turnout
- Previous election result summary
- Booth-level historical information
- Campaign progress comparison

लेकिन यह section मुख्य dashboard का focus नहीं होगा।

---

# 15. Dashboard पर क्या नहीं रखना चाहिए

कुछ information को मुख्य Dashboard में deliberately नहीं भरना चाहिए।

### मुख्य Dashboard पर नहीं:

- बहुत बड़े demographic charts
- पूरी voter list
- पूरा household database
- पूरा booth database
- सभी workers की पूरी सूची
- सभी events की पूरी सूची
- पूरा campaign analytics
- detailed historical reports

इनके लिए अलग modules होंगे।

इससे Dashboard साफ और उपयोगी रहेगा।

---

# 16. Existing Campaign Progress Page का स्थान

आपके screenshot में जो page है:

**Campaign Progress & Election Readiness**

वह **अलग page के रूप में रहेगा।**

उसमें:

### Overall Readiness
↓
### Weighted Metrics
↓
### Booth Drill-down
↓
### Worker Progress
↓
### Detailed Analysis

होगा।

मुख्य Dashboard पर सिर्फ:

> **Election Readiness: 72%**  
> 3 Critical Booths | 7 Attention Required  
> **View Detailed Progress →**

दिखेगा।

---

# 17. Main Navigation Structure

Candidate के लिए navigation roughly इस तरह होगा:

### 🏠 Candidate Dashboard

मुख्य command center

### 📈 Campaign Progress

Overall readiness + detailed progress

### 👥 Voter / Household Data

Household और संबंधित operational information

### 🗺️ Household Map

Household locations और field coverage

### 📅 Campaign / Events

Events और campaign activities

### 👷 Workers / Volunteers

Team management और activity

### 🗳️ Booth Management

Booth-wise organisation और readiness

### 📋 Tasks

Assigned / pending / completed tasks

### 🔔 Notifications

System और campaign notifications

### 📊 Reports / Analytics

Detailed reporting

---

# 18. Dashboard Data Relationships

Dashboard अलग से data store नहीं करेगा।

यह existing modules के data से summary बनाएगा।

### Basic relationship

**Constituency**

↓  

**Booths**

↓

**Households**

↓

**Household Visits**

↓

**Field Workers**

↓

**Tasks / Reports**

और parallel:

**Campaign**

↓

**Events**

↓

**Attendance / Status**

इन सभी से dashboard metrics तैयार होंगे।

---

# 19. Real-time / Data Refresh

Dashboard का data stale नहीं रहना चाहिए।

जहाँ संभव हो:

- Visit complete होने पर coverage update
- Household status बदलने पर coverage update
- Worker assignment पर booth status update
- Event complete होने पर event statistics update
- Task complete होने पर task count update
- New issue आने पर priority count update

### उदाहरण

Worker ने 20 households visit किए।

तो:

**Visited: 6,500 → 6,520**

और:

**Pending: 3,500 → 3,480**

Dashboard automatically update हो सकता है।

---

# 20. Candidate Dashboard के लिए User Flow

Candidate login करता है।

↓

### Dashboard

↓

**Overall Readiness: 72%**

↓

Candidate देखता है:

**3 booths critical**

↓

Booth section खोलता है।

↓

**Booth 12**

↓

देखता है:

**Team assignment incomplete**

↓

Worker/Booth Management में जाता है।

यह पूरा system candidate को **problem → reason → action** तक ले जाना चाहिए।

---

# 21. Implementation Plan

## Phase 1 — Dashboard Foundation

- Candidate authentication
- Constituency identification
- Candidate profile
- Dashboard layout
- Header
- Navigation
- Last updated indicator

---

## Phase 2 — Core Metrics

Dashboard में:

- Total households
- Visited
- Pending
- Revisit
- Total booths
- Active workers
- Events
- Tasks

जोड़ना।

---

## Phase 3 — Household & Field Integration

- Household coverage
- Visit tracking
- Revisit status
- Field worker activity
- Booth-wise coverage

Dashboard से actual field data connect करना।

---

## Phase 4 — Booth Integration

- Booth readiness
- Team assignment
- Reporting status
- Priority booths
- Critical/attention status

---

## Phase 5 — Campaign/Event Integration

- Upcoming events
- Today's events
- Event status
- Attendance summary

---

## Phase 6 — Tasks & Issues

- Pending tasks
- Overdue tasks
- Critical issues
- Resolution status

---

## Phase 7 — Election Readiness Engine

- Readiness metrics
- Weight configuration
- Overall score
- Component scores
- Booth readiness
- Organisation readiness

---

## Phase 8 — Map Integration

Dashboard पर map snapshot और detailed Household Map से connection।

---

## Phase 9 — Notifications

- New task
- Event update
- Booth alert
- Field report
- Critical issue
- System notification

---

## Phase 10 — Final Dashboard Optimization

अंत में:

- Mobile responsiveness
- Loading states
- Empty states
- Error states
- Performance
- Permission checking
- Data freshness
- Candidate-specific data isolation

---

# 22. Acceptance Criteria

Dashboard को complete तभी माना जाएगा जब candidate:

### बिना दूसरे page पर जाए यह देख सके:

- [ ] Constituency
- [ ] Candidate identity
- [ ] Overall readiness
- [ ] Readiness breakdown
- [ ] Today's activity
- [ ] Household coverage
- [ ] Priority booths
- [ ] Upcoming events
- [ ] Team status
- [ ] Pending tasks
- [ ] Critical issues
- [ ] Election readiness

### और एक click में जा सके:

- [ ] Campaign Progress
- [ ] Household Map
- [ ] Booth Management
- [ ] Events
- [ ] Worker Progress
- [ ] Tasks
- [ ] Notifications

---

# 23. Final Product Definition

VoterAction का Candidate Dashboard अंततः यह अनुभव देना चाहिए:

> **"मेरे पूरे चुनावी अभियान की स्थिति एक जगह मेरे सामने है।"**

Candidate को dashboard खोलते ही तीन चीजें सबसे पहले समझ आनी चाहिए:

### 1. मेरी कुल स्थिति क्या है?
**Election Readiness — 72%**

### 2. अभी समस्या कहाँ है?
**3 Critical Booths + 8 Critical Issues**

### 3. मुझे अभी क्या करना चाहिए?
**Today's Events + Pending Tasks + Priority Areas**

और यदि उसे detail चाहिए तो वह संबंधित module में चला जाए।

**इस architecture में आपका वर्तमान “Campaign Progress & Election Readiness” page भी बना रहेगा और मुख्य Dashboard उसके ऊपर एक साफ, actionable command center की भूमिका निभाएगा।**