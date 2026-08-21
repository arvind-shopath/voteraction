# VoterAction — Household Mapping & Field Verification
## Project Specification & Implementation Plan

**Document Type:** Product / Technical Planning Document  
**Scope:** EC data import के बाद Household, Voter, Location, Map और Field Operations  
**Code:** इस document में कोई code शामिल नहीं है।

---

# 1. Project Objective

VoterAction में Election Commission से प्राप्त booth-wise data पहले से सही तरीके से structured data में convert हो रहा है।

इस data में उपलब्ध जानकारी जैसे:

- Booth / Part
- मकान नंबर
- पूरा पता
- गाँव / Locality
- Post
- तहसील
- जिला
- राज्य
- Voter information

को उपयोग करके VoterAction में **automatic geographic household mapping और field-management system** तैयार करना है।

मुख्य उद्देश्य:

> **Data import होते ही संबंधित households system में बनें, उनके addresses सुरक्षित रहें, उपलब्ध location के आधार पर map पर दिखाई दें और बाद में field team उनकी location/visit को verify कर सके।**

---

# 2. महत्वपूर्ण Scope Decision

इस project में **PDF से data निकालने का काम शामिल नहीं है।**

यह हिस्सा पहले से working और accurate माना जाएगा।

हमारा काम शुरू होगा:

> **Structured EC Data मिलने के बाद**

अर्थात:

**EC Data → Household/Relationship → Location → Map → Field Verification**

---

# 3. Core Architecture

VoterAction में मुख्य hierarchy होगी:

**Election**

↓  
**Constituency**

↓  
**Booth / Part**

↓  
**Village / Locality**

↓  
**Household**

↓  
**Voter**

इसके साथ:

**Household → Location**

और:

**Household → Field Visits**

**Household → Assigned Worker**

---

# 4. Household को Primary Unit बनाया जाएगा

इस project का सबसे महत्वपूर्ण architectural decision:

> **Household map और field-work की primary unit होगा।**

Voter household का child record होगा।

### उदाहरण

एक मकान:

**House No. 125**

में:

- Voter A
- Voter B
- Voter C
- Voter D

हो सकते हैं।

System में:

**1 Household**

और उसके अंदर:

**4 Voters**

रहेंगे।

Map पर भी:

**4 pins नहीं**

बल्कि:

**1 Household pin**

दिखेगा।

---

# 5. Data Relationships

## 5.1 Election

एक चुनाव को represent करेगा।

उदाहरण:

> Election 2027

---

## 5.2 Constituency

Election के अंदर constituency/निर्वाचन क्षेत्र होगा।

Relationship:

**One Election → Multiple Constituencies**

---

## 5.3 Booth / Part

Constituency के अंदर polling parts/booths होंगे।

Relationship:

**One Constituency → Multiple Booths**

हर imported EC record को उसके संबंधित Booth/Part से जोड़ा जाएगा।

---

# 6. Village / Locality

एक Booth में एक या अधिक villages/localities हो सकते हैं।

उदाहरण:

**Booth 125**

- रामपुर
- शिवपुर
- लक्ष्मीपुर

Relationship:

**Booth → Villages/Localities**

Village को केवल address के अंदर text के रूप में नहीं रखना है।

इसे अलग entity रखना बेहतर होगा।

इससे बाद में reports बनाई जा सकेंगी:

> रामपुर में कितने households हैं?

> किस village में mapping पूरी हुई?

> किस village में field visits pending हैं?

---

# 7. Household Structure

प्रत्येक Household का अपना unique system ID होगा।

उदाहरण:

> Household ID: H-125-00452

इसके साथ:

- Booth
- Village
- House Number
- Full Address
- Tehsil
- District
- State
- PIN, यदि उपलब्ध हो
- अन्य EC address information

सुरक्षित रहेगी।

---

# 8. Address को Structured + Full दोनों रूप में रखना

Address को केवल एक लंबे text field में नहीं रखना है।

दो स्तर होने चाहिए।

### Structured Address

- House Number
- Street/Lane, यदि उपलब्ध
- Village/Locality
- Post
- Tehsil
- District
- State
- PIN

### Full Official Address

EC data में जैसा पूरा address उपलब्ध है, वह भी **original form में सुरक्षित** रखा जाएगा।

इससे:

- filtering आसान होगी
- reports आसान होंगी
- geocoding आसान होगा
- original address सुरक्षित रहेगा

---

# 9. Voter Relationship

प्रत्येक voter record को Household से link किया जाएगा।

मुख्य relationship:

> **One Household → Many Voters**

और प्रत्येक Voter से reverse lookup संभव होना चाहिए:

> Voter → Household → Village → Booth → Constituency → Election

इससे candidate/team को किसी voter का पूरा administrative context मिल सकेगा।

---

# 10. Original EC Data को Preserve करना

यह अत्यंत महत्वपूर्ण requirement है।

EC से आया मूल data **overwrite नहीं किया जाएगा।**

System में अलग-अलग layers रहेंगी:

### Layer 1 — Official/Imported Data

जो EC source से आया।

### Layer 2 — System Enrichment

जैसे:

- geocoded location
- household grouping
- map coordinates

### Layer 3 — Field Verification

जैसे:

- verified location
- visit
- field notes
- operational status

इससे यह हमेशा पता रहेगा:

> कौन-सी जानकारी official source से आई और कौन-सी field team ने बाद में जोड़ी।

---

# 11. Household Location

हर Household के लिए location information रखी जाएगी:

- Latitude
- Longitude
- Location Source
- Location Status
- Verification date
- Verified by

---

# 12. Location Status

Location को केवल Yes/No नहीं रखना है।

Recommended states:

### 1. Unmapped

अभी कोई location उपलब्ध नहीं।

### 2. Approximate

Area/village level location उपलब्ध है, लेकिन exact household location verified नहीं है।

### 3. Geocoded

Address को geocoding service से coordinates मिले हैं।

### 4. Field Verified

Field worker ने वास्तविक location verify की है।

इस distinction से map पर गलत accuracy claim नहीं होगा।

---

# 13. Geocoding Strategy

क्योंकि आपके पास पूरा address उपलब्ध है:

**House No. + Village + Tehsil + District + State**

इसलिए address को geocoding के लिए उपयोग किया जाएगा।

### प्रारंभिक technology

**OpenStreetMap ecosystem + Geocoding service**

से शुरुआत की जा सकती है।

लेकिन system को यह मानकर नहीं चलना चाहिए कि हर Indian household address से automatically exact house location मिलेगी।

इसलिए geocoding result के साथ confidence/status रखा जाएगा।

---

# 14. Map Technology

### Initial Recommendation

**Leaflet**

के साथ:

**OpenStreetMap-based map tiles**

का उपयोग किया जाएगा।

फायदे:

- Google Maps पर mandatory dependency नहीं
- शुरुआती testing cost कम
- lightweight
- markers
- clustering
- map layers
- zoom
- interaction

सब उपलब्ध हैं।

Production scale बढ़ने पर dedicated map tile provider इस्तेमाल किया जा सकता है।

---

# 15. Map Layers

Map में अलग-अलग layers होंगी।

### Layer 1 — Constituency

पूरे क्षेत्र का overview।

### Layer 2 — Booth

Booth-wise geographic area।

### Layer 3 — Village

Village/locality boundaries या locations।

### Layer 4 — Household

Individual household markers।

इससे user zoom करके:

**Constituency → Booth → Village → Household**

तक जा सकेगा।

---

# 16. Household Marker

हर mapped household का एक marker होगा।

Marker पर click करने पर:

**Household ID**

**House Number**

**Village**

**Tehsil**

**District**

**Number of Voters**

**Location Status**

**Field Visit Status**

दिख सकता है।

और:

**View Household**

से पूरा record खोला जा सकेगा।

---

# 17. Marker Clustering

यदि किसी village में हजारों households हैं तो map पर हजारों markers एक साथ नहीं दिखाए जाएंगे।

Zoom-out पर:

> **● 428**

जैसा cluster दिखाई देगा।

Zoom-in करने पर cluster टूटकर individual households दिखाई देंगे।

यह performance के लिए भी महत्वपूर्ण है।

---

# 18. Map Filters

Map पर कम से कम ये filters होने चाहिए:

### Administrative

- Election
- Constituency
- Booth
- Village

### Location

- Unmapped
- Approximate
- Geocoded
- Field Verified

### Field Work

- Not Visited
- Visited
- Revisit Required

### Worker

- Assigned Worker
- Unassigned

इससे candidate/team पूरे map को एक साथ देखने के बजाय relevant data देख सकेगी।

---

# 19. Household Details

किसी household पर click करने पर:

## Household Information

- Household ID
- Address
- Village
- Booth
- Tehsil
- District

## Members

- Linked voters
- Available voter information

## Location

- Map position
- Location status
- Verification status

## Field Operations

- Assigned worker
- Visit history
- Last visit
- Follow-up

---

# 20. Worker Assignment

Household को field worker से link किया जा सकेगा।

उदाहरण:

> Worker: Ravi  
> Booth: 125  
> Village: Rampur  
> Assigned Households: 450

Worker को application में केवल उसके assigned operational records दिखाए जा सकते हैं।

इससे पूरी voter database हर volunteer के सामने expose नहीं होगी।

---

# 21. Field Verification

यदि household की location:

**Geocoded**

है, तो field worker उसे मौके पर verify कर सकेगा।

Workflow:

**Household खोलें**

↓

**Map देखें**

↓

**Verify Location**

↓

GPS/current location capture

↓

**Field Verified**

↓

Verification timestamp और worker record save

---

# 22. Door-to-Door Visit

Household-level visit tracking होगा।

एक household में बार-बार visits हो सकती हैं।

उदाहरण:

**Household H452**

- Visit 1 — 21 Aug
- Visit 2 — 24 Aug
- Visit 3 — 28 Aug

हर visit में:

- Date/time
- Worker
- Visit status
- Operational notes
- Follow-up requirement

जैसी information रखी जा सकती है।

---

# 23. Offline Support

VoterAction में पहले से offline capability होने के कारण यह module भी offline-first तरीके से काम करेगा।

Worker field में:

- Household खोल सके
- Address देख सके
- Map/location information देख सके
- Location verify कर सके
- Visit record कर सके
- Notes save कर सके

Internet न होने पर data local queue में रहेगा।

Internet आने पर:

> **Local Data → Sync Queue → Server**

के माध्यम से synchronize होगा।

---

# 24. Synchronization Rules

Offline sync में:

- duplicate submission रोकना
- unique record IDs
- timestamp
- user/worker ID
- last sync status
- failed sync retry

रखना आवश्यक है।

यदि दो devices ने एक ही record बदला है तो automatic overwrite नहीं होना चाहिए।

Conflict handling policy अलग से तय होगी।

---

# 25. Duplicate Household Handling

House number को अकेले household identity नहीं माना जाएगा।

उदाहरण:

> House 25  
> Family A  
> Family B

इसलिए household grouping के लिए:

- Booth
- Village
- Address
- EC source information
- voter relationship

जैसे fields का उपयोग होगा।

Possible duplicate मिलने पर:

> **Possible Duplicate**

दिखाया जाएगा।

Automatic merge नहीं किया जाएगा।

Admin review के बाद merge/keep-separate decision होगा।

---

# 26. Privacy & Permission Model

यह system voter-related data संभालेगा, इसलिए permissions शुरुआत से architecture में शामिल होंगी।

उदाहरण:

### Candidate

पूरे authorized constituency का dashboard।

### Campaign Manager

Operational management।

### Area Coordinator

अपने assigned area तक।

### Booth Coordinator

अपने assigned booth तक।

### Field Worker

केवल assigned households/required information।

इससे data exposure कम होगा।

---

# 27. Political Status को Household का Default Field नहीं बनाना

Household import होते ही उसे:

> **Neutral**

के नाम से political classification नहीं दिया जाएगा।

Initial state:

> **Not Yet Verified**

रहेगी।

किसी व्यक्ति की राजनीतिक preference या voting choice को infer/assume नहीं किया जाएगा।

और secret ballot से संबंधित information कभी system में collect नहीं की जानी चाहिए।

---

# 28. Audit Trail

हर महत्वपूर्ण बदलाव का record होना चाहिए:

- किसने किया
- कब किया
- क्या बदला
- पहले क्या था
- बाद में क्या हुआ

विशेषकर:

- Address changes
- Household merge
- Household split
- Location verification
- Worker assignment
- Field visit
- Data import/update

---

# 29. Candidate Dashboard

इस पूरे system से dashboard automatically बनाया जा सकता है।

उदाहरण:

### Booth 125

**Villages:** 4  
**Households:** 3,240  
**Voters:** 8,712

### Location Mapping

**Field Verified:** 1,850  
**Geocoded:** 1,120  
**Approximate:** 240  
**Unmapped:** 30

### Field Work

**Visited:** 2,410  
**Pending:** 830  
**Revisit:** 214

इससे candidate को वास्तविक campaign operations की स्थिति समझ आएगी।

---

# 30. Implementation Plan

अब इसे development में इस क्रम से करना चाहिए।

## Phase 1 — Data Model

सबसे पहले database relationships final किए जाएँ:

1. Election
2. Constituency
3. Booth
4. Village/Locality
5. Household
6. Voter
7. Household Location
8. Field Worker
9. Household Assignment
10. Field Visit

### Output

पूरा relational structure तैयार।

---

# Phase 2 — EC Data Relationship

क्योंकि extraction पहले से solved है:

1. Imported EC record को Election से जोड़ना
2. Constituency से जोड़ना
3. Booth/Part से जोड़ना
4. Village से जोड़ना
5. Household identify/create करना
6. Voter को Household से link करना
7. Original EC fields preserve करना

### Output

**EC Data → Booth → Village → Household → Voter**

पूरा relation तैयार।

---

# Phase 3 — Household Management

अब Household module:

1. Household list
2. Household details
3. Address display
4. Linked voters
5. Booth/Village relation
6. Search
7. Filters
8. Duplicate review

### Output

एक household को independently manage किया जा सके।

---

# Phase 4 — Location System

1. Latitude/Longitude fields
2. Location status
3. Geocoding
4. Geocoding result storage
5. Accuracy/confidence
6. Manual correction
7. Field verification

### Output

Household के साथ reliable location system।

---

# Phase 5 — Map

1. Leaflet integration
2. OpenStreetMap-based tiles
3. Household markers
4. Marker clustering
5. Booth layer
6. Village layer
7. Filters
8. Household popup
9. Household detail navigation

### Output

**पूरा Booth/Village/Household interactive map।**

---

# Phase 6 — Worker & Field Operations

1. Worker creation
2. Role/permission
3. Area/Booth assignment
4. Household assignment
5. My Households
6. Location verification
7. Door-to-door visit
8. Visit history
9. Follow-up

### Output

Map से सीधे field operations चल सकेंगे।

---

# Phase 7 — Offline Sync

1. Local household data
2. Local location updates
3. Local visits
4. Offline queue
5. Sync
6. Retry
7. Conflict handling
8. Sync status

### Output

Internet के बिना भी field work जारी रहेगा।

---

# Phase 8 — Dashboard & Reports

1. Booth statistics
2. Village statistics
3. Household count
4. Voter count
5. Mapping progress
6. Verification progress
7. Visit progress
8. Worker performance
9. Pending work
10. Exception reports

---

# Phase 9 — Security & Audit

अंत में नहीं, बल्कि development के दौरान ही:

1. Role-based access
2. API authorization
3. Audit logs
4. Data encryption/security
5. Backup
6. Data retention
7. Access logging
8. Import history

---

# 31. Recommended Development Order

पूरे module को एक साथ बनाने की बजाय यह क्रम सबसे सुरक्षित रहेगा:

### Step 1
**Database relationship**

### Step 2
**EC → Booth → Village → Household → Voter**

### Step 3
**Household management**

### Step 4
**Location system**

### Step 5
**Map**

### Step 6
**Worker assignment**

### Step 7
**Field verification**

### Step 8
**Door-to-door visits**

### Step 9
**Offline sync**

### Step 10
**Dashboard & reports**

### Step 11
**Security/Audit hardening**

---

# 32. Acceptance Criteria

Module को complete तब माना जाएगा जब:

### Data

- EC data सही Booth से linked हो
- Village relation सही हो
- Household correctly created हो
- Multiple voters एक household से link हो सकें
- Original EC data सुरक्षित रहे

### Map

- Imported households map पर दिखाई दें
- Clustering काम करे
- Booth/Village filtering काम करे
- Location status दिखाई दे
- Field verification के बाद location update हो

### Field

- Worker को assigned households मिलें
- Offline visit record हो
- Internet आने पर sync हो
- Visit history सुरक्षित रहे

### Security

- Worker unauthorized households न देख सके
- Original data बिना permission बदल न सके
- Important actions audit हों

---

# 33. Final Product Flow

अंततः VoterAction में पूरा workflow यह होगा:

**EC Structured Data**

↓

**Election**

↓

**Constituency**

↓

**Booth**

↓

**Village**

↓

**Household**

↓

**Voters**

↓

**Automatic/Assisted Location**

↓

**Map**

↓

**Location Verification**

↓

**Worker Assignment**

↓

**Door-to-Door Visit**

↓

**Offline Sync**

↓

**Dashboard & Reports**

---

## सबसे महत्वपूर्ण Product Decision

इस पूरे project की foundation यह होगी:

> **“Voter” नहीं, बल्कि “Household” को map और field operation की primary unit बनाना है।**

और:

> **EC का original data authoritative रहेगा; map location और field information उसके ऊपर enrichment layers के रूप में जुड़ेंगी।**

इस architecture से बाद में Campaign/Event Management, Volunteer Management, Announcements, Election-Day Operations और Analytics को भी इसी existing data structure के ऊपर जोड़ा जा सकेगा—बिना पूरे system को दोबारा बनाने की जरूरत पड़े।