# VoterAction — Campaign, Event, Field Visit & Campaign Progress
## Project Specification & Implementation Plan

**Document Type:** Product / Technical Planning Document  
**Scope:** Campaign/Event Management + Door-to-Door Visit Tracking + Campaign Progress Dashboard  
**Code:** इस document में कोई code शामिल नहीं है।

---

# 1. Project Objective

इस module का उद्देश्य VoterAction को केवल voter/household database न रखकर एक **Campaign Operations Management System** बनाना है।

Candidate और उनकी authorized team एक ही जगह से:

- Campaign events
- Meetings
- Field visits
- Workers/volunteers
- Assignments
- Tasks
- Progress
- Pending work
- Operational issues

को manage और monitor कर सके।

मुख्य flow:

**Campaign Planning**

↓

**Event Management**

↓

**Team/Volunteer Assignment**

↓

**Field Operations**

↓

**Door-to-Door Visits**

↓

**Activity Data**

↓

**Campaign Progress Dashboard**

---

# 2. Module Architecture

इन तीनों features को अलग-अलग isolated modules नहीं बनाना चाहिए।

इनका relationship होना चाहिए:

**Campaign**

↓  
**Events**

↓  
**Workers / Volunteers**

↓  
**Tasks**

↓  
**Households / Areas**

↓  
**Field Visits**

↓  
**Progress**

और पूरा data:

↓  

**Campaign Dashboard**

में आए।

---

# 3. Campaign Entity

सबसे ऊपर एक **Campaign** entity होगी।

उदाहरण:

> Campaign: 2027 Assembly Election  
> Constituency: XYZ  
> Start Date: 1 August  
> End Date: Election Date  
> Campaign Manager: X

Campaign के अंदर उसके:

- Events
- Teams
- Volunteers
- Tasks
- Field activities
- Progress

रहेंगे।

इससे future में एक ही system में अलग-अलग elections/campaigns को अलग रखा जा सकेगा।

---

# 4. Campaign / Event Management

## 4.1 Event का उद्देश्य

हर campaign activity को एक structured event बनाया जाएगा।

उदाहरण:

> **जनसभा**  
> 25 August  
> Ward 12  
> Responsible: X  
> Volunteers: 15  
> Status: Upcoming

इससे WhatsApp messages, notebooks और अलग-अलग calendars पर dependency कम होगी।

---

# 5. Event Data Structure

प्रत्येक event में:

### Basic Information

- Event name
- Event type
- Campaign
- Date
- Start time
- End time
- Location
- Address
- Description
- Notes

### Management

- Responsible person
- Assigned volunteers
- Assigned workers
- Event status
- Priority

### Attendance

- Expected attendance
- Actual attendance
- Attendance status

### Attachments

- Photographs
- Documents
- Event-related files

---

# 6. Event Types

Event type predefined भी हो सकते हैं और custom भी।

उदाहरण:

- Public Meeting
- Meeting
- Door-to-Door Drive
- Volunteer Meeting
- Community Event
- Campaign Activity
- Training
- Internal Coordination
- Other

Admin को आवश्यकता के अनुसार नए types जोड़ने की सुविधा दी जा सकती है।

---

# 7. Event Status

Event के लिए स्पष्ट lifecycle होगा:

**Draft**

↓

**Scheduled**

↓

**Upcoming**

↓

**Ongoing**

↓

**Completed**

या:

**Cancelled**

और आवश्यकता होने पर:

**Postponed**

इससे dashboard में केवल “event है/नहीं है” जैसी अस्पष्ट स्थिति नहीं रहेगी।

---

# 8. Event Calendar

Campaign Manager और Candidate के लिए calendar view होगा।

### Calendar में:

- Today
- This week
- This month
- Upcoming
- Completed

देखा जा सकेगा।

Event पर click करने पर उसका पूरा detail खुलेगा।

---

# 9. Event List View

Calendar के अलावा list view भी जरूरी है।

उदाहरण:

| Date | Event | Location | Responsible | Status |
|---|---|---|---|---|
| 25 Aug | जनसभा | Ward 12 | X | Upcoming |
| 26 Aug | Team Meeting | Office | Y | Scheduled |
| 27 Aug | Field Drive | Booth 125 | Z | Scheduled |

इससे operational management आसान रहेगा।

---

# 10. Event Location

Event location को केवल text address न रखें।

जहाँ संभव हो:

- Address
- Latitude
- Longitude
- Map location

भी रखा जाए।

Event detail में:

**View on Map**

और आवश्यकता के अनुसार:

**Navigate**

का विकल्प हो सकता है।

---

# 11. Responsible Person

हर event का एक primary responsible person होगा।

उदाहरण:

> Responsible: Ward Coordinator

लेकिन इसके अलावा multiple volunteers/workers assign किए जा सकेंगे।

Relationship:

**Event → Responsible Person**

और:

**Event → Multiple Assigned Team Members**

---

# 12. Volunteer Assignment

Event बनाते समय:

**Assign Team**

का विकल्प होना चाहिए।

इससे पता रहेगा:

- कौन event में assigned है
- कितने लोग assigned हैं
- कौन उपस्थित हुआ
- किसकी attendance pending है

---

# 13. Expected vs Actual Attendance

Event management में यह महत्वपूर्ण metric होगा।

उदाहरण:

**Expected:** 500  
**Actual:** 425

इससे historical reporting भी हो सकती है।

लेकिन actual attendance को responsible team द्वारा manually/operationally recorded किया जा सकता है; system को इसे अनुमानित या स्वतः generated number नहीं मानना चाहिए।

---

# 14. Event Attachments

Event के साथ files attach की जा सकें:

- Photos
- Documents
- Meeting notes
- Attendance records
- Other operational documents

हर attachment event से linked रहेगा।

---

# 15. Event Notes

Event के साथ:

- Pre-event notes
- During-event notes
- Post-event notes

रखे जा सकते हैं।

उदाहरण:

> Venue changed from 5 PM to 6 PM.

या:

> Event completed successfully.

---

# 16. Event Reminders / Notifications

Event system को notification system से जोड़ना चाहिए।

उदाहरण:

**Volunteer:**

> “आपको कल 10 AM के event में assign किया गया है।”

**Responsible Person:**

> “Event 2 घंटे में शुरू होगा।”

**Campaign Manager:**

> “आज 4 events scheduled हैं।”

Notification channels architecture में अलग रखे जा सकते हैं ताकि बाद में:

- In-app
- Push
- अन्य authorized channels

जोड़े जा सकें।

---

# 17. Door-to-Door Visit Tracking

अब campaign का दूसरा मुख्य component:

**Field Visit Management**

यह पहले बनाए गए Household Mapping module से सीधे जुड़ा होगा।

मुख्य relationship:

**Household**

→ **Assigned Worker**

→ **Visit**

---

# 18. Visit की Basic Identity

हर visit में system को पता होना चाहिए:

> **कौन → कहाँ → कब → किस household से मिला → क्या visit status है**

इसलिए Visit record में:

- Household
- Worker
- Date
- Time
- Visit status
- Location validation
- Notes
- Follow-up status

रहेंगे।

---

# 19. Assigned Households

Worker को उसका assigned workload दिखाई देगा।

उदाहरण:

### Ravi

**Assigned:** 500 households

- Visited: 320
- Pending: 180
- Revisit: 45

Worker का mobile interface मुख्यतः उसके assigned operational data पर आधारित होगा।

---

# 20. Visit Status

Recommended statuses:

**Not Visited**

**Visited**

**Revisit Required**

**Unable to Contact**

**Scheduled for Follow-up**

और आवश्यकता के अनुसार अन्य operational states।

Status को campaign/political preference से अलग रखना चाहिए।

---

# 21. Visit Date & Time

हर visit के साथ:

- Date
- Time
- Worker
- Device/session information, जहाँ आवश्यक हो

का audit record रहेगा।

इससे बाद में:

> “यह household कब visit हुआ?”

का स्पष्ट उत्तर मिलेगा।

---

# 22. Location / GPS Validation

जहाँ उचित और कानूनी हो, field worker की location को household location के साथ validate किया जा सकता है।

इसका उद्देश्य:

> **Field worker वास्तव में assigned location पर पहुँचा था या नहीं**

जैसी operational verification हो सकता है।

लेकिन इसे privacy-conscious तरीके से लागू किया जाना चाहिए।

GPS tracking को लगातार background surveillance की तरह नहीं रखना चाहिए।

बेहतर है:

> **Visit के समय location verification**

---

# 23. Household Verification

Door-to-door visit के दौरान worker:

- Household address verify
- Location verify
- Household record correction request
- Visit status
- Follow-up requirement

जैसी operational चीजें update कर सकता है।

Official EC information को सीधे overwrite नहीं करना चाहिए।

यदि correction मिले:

> **Field Suggested Change**

के रूप में रखा जा सकता है।

---

# 24. Offline Visit Entry

यह feature अत्यंत महत्वपूर्ण है।

Worker के पास internet न होने पर भी:

**Household खोलें**

↓

**Record Visit**

↓

**Save Locally**

↓

**Continue Field Work**

कर सके।

Network आने पर:

**Local Queue → Server Sync**

हो।

---

# 25. Sync System

हर offline action का:

- Unique ID
- Timestamp
- Worker
- Local status
- Server status

रहे।

यदि sync fail हो:

> **Pending Sync**

दिखे।

और connection वापस आने पर automatic retry हो।

---

# 26. Campaign Progress

अब तीसरा और सबसे महत्वपूर्ण layer:

# Campaign Progress Dashboard

यह अलग से data maintain करने वाला module नहीं होना चाहिए।

यह बाकी modules से **automatically calculated** होना चाहिए।

उदाहरण:

**Household data**

+

**Visit data**

+

**Event data**

+

**Worker assignments**

+

**Task data**

↓

**Campaign Progress**

इससे 72% जैसा arbitrary number manually नहीं डालना पड़ेगा।

---

# 27. Organisation Dashboard

Candidate को:

### Organisation

- Total Wards
- Total Booths
- Active Workers
- Active Volunteers
- Unassigned Areas
- Unassigned Households

दिख सकते हैं।

---

# 28. Field Work Dashboard

### Field Coverage

- Total Households
- Visited
- Pending
- Revisit Required
- Unverified
- Location Verified

उदाहरण:

> **10,000 Households**
>
> Visited: **6,500**
>
> Pending: **3,500**
>
> Revisit: **850**

यह data Household/Visit module से automatically आएगा।

---

# 29. Campaign Dashboard

### Campaign Activities

- Total Events
- Upcoming Events
- Ongoing Events
- Completed Events
- Cancelled Events
- Pending Tasks

और:

**Expected Attendance**

vs

**Actual Attendance**

जैसे metrics।

---

# 30. Election Readiness

यह operational readiness के रूप में dashboard पर दिखेगा।

उदाहरण:

### Booth Readiness

- Booths with assigned teams
- Booths without assigned teams
- Booths with pending field work
- Booths with outstanding operational issues
- Reporting coverage

यह readiness score को explainable बनाएगा।

---

# 31. Overall Campaign Readiness

एक single percentage दिखाया जा सकता है:

> **Campaign Readiness: 72%**

लेकिन यह number manually नहीं बनेगा।

इसके पीछे measurable components होंगे।

उदाहरण:

**Organisation readiness**

+

**Household mapping**

+

**Field coverage**

+

**Team assignment**

+

**Event execution**

+

**Operational task completion**

से score/indicators निकाले जा सकते हैं।

### महत्वपूर्ण

हर component का weight पहले तय किया जाएगा।

उदाहरण:

> Field Coverage — 30%  
> Team Assignment — 20%  
> Event Readiness — 15%  
> Household Mapping — 20%  
> Tasks — 15%

ये weights बाद में campaign requirements के अनुसार बदले जा सकते हैं।

---

# 32. Drill-Down Dashboard

Candidate केवल percentage देखकर संतुष्ट नहीं होगा।

अगर:

> **Campaign Readiness = 72%**

तो उस पर click करने पर:

> Household Coverage — 78%  
> Worker Assignment — 91%  
> Event Execution — 65%  
> Task Completion — 70%

और फिर:

**Event Execution → Booth/Area → Individual Events**

तक जाना संभव होना चाहिए।

यानी:

> **Score → Reason → Problem → Record**

---

# 33. Area-wise Progress

Candidate पूरे constituency के बजाय:

**Ward**

या

**Booth**

या

**Village**

select कर सकेगा।

उदाहरण:

> Booth 125  
> Household Coverage: 81%  
> Visits: 72%  
> Worker Assignment: 100%  
> Pending Tasks: 14

इससे weak areas आसानी से identify होंगे।

---

# 34. Worker-wise Progress

Campaign Manager देख सके:

> Ravi  
> Assigned: 500  
> Visited: 420  
> Pending: 80  
> Revisit: 32

और:

> Meena  
> Assigned: 450  
> Visited: 390  
> Pending: 60

इसका उपयोग **operational workload management** के लिए होगा, न कि किसी व्यक्ति की political preference profiling के लिए।

---

# 35. Event + Field Visit Integration

यह बहुत महत्वपूर्ण integration है।

मान लीजिए:

> **Field Drive — Booth 125**

Event बनाते समय:

- Booth 125
- Assigned workers
- Target area
- Start/end time

जुड़ा हो।

Event complete होने के बाद field activity उसी campaign event से associate की जा सकती है।

इससे:

> Event → Team → Area → Field Activity

का पूरा chain बनेगा।

---

# 36. Task Management

Campaign Progress को मजबूत बनाने के लिए Events और Field Visits के ऊपर **Tasks** रखना उपयोगी होगा।

उदाहरण:

> Event: जनसभा  
> Task: Venue confirmation  
> Responsible: X  
> Due: 24 Aug  
> Status: Pending

या:

> Field Drive  
> Task: Booth 125 household assignment  
> Responsible: Y  
> Status: Completed

Task statuses:

- Pending
- In Progress
- Completed
- Blocked
- Cancelled

---

# 37. Operational Issues

Campaign में unexpected problems आएँगे।

इसलिए एक छोटा:

**Issues / Exceptions**

system भी होना चाहिए।

उदाहरण:

- Worker unavailable
- Event postponed
- Location issue
- Household address issue
- Sync issue
- Missing report
- Resource requirement

हर issue:

**Responsible person + Priority + Status + Resolution**

से linked हो।

---

# 38. Permissions

Recommended roles:

### Candidate

Full authorized campaign overview।

### Campaign Manager

Campaign + Events + Field Operations।

### Area Coordinator

Assigned area।

### Booth Coordinator

Assigned booth।

### Volunteer

Assigned events/tasks/required field records।

### Field Worker

Assigned households और visits।

हर role को आवश्यकता से अधिक voter/contact data नहीं दिखाया जाना चाहिए।

---

# 39. Audit Trail

इन actions का audit होना चाहिए:

- Event created
- Event edited
- Event cancelled
- Volunteer assigned
- Household assigned
- Visit recorded
- Visit modified
- Task completed
- Issue resolved
- Attendance updated

Audit में:

**Who + What + When**

रहे।

---

# 40. Implementation Plan

अब development इसी क्रम में करना चाहिए।

## Phase 1 — Campaign Foundation

पहले:

1. Campaign entity
2. Election relation
3. Constituency relation
4. Campaign dates
5. Campaign manager
6. Campaign status

### Result

एक campaign का central container तैयार।

---

# Phase 2 — Event Management

1. Event entity
2. Event types
3. Date/time
4. Location
5. Responsible person
6. Team assignment
7. Expected attendance
8. Actual attendance
9. Status
10. Notes
11. Attachments

### Result

पूरा Event Management system।

---

# Phase 3 — Event Calendar

1. Calendar view
2. List view
3. Upcoming events
4. Completed events
5. Event filtering
6. Event detail

### Result

Campaign calendar तैयार।

---

# Phase 4 — Worker/Volunteer Integration

1. Workers
2. Volunteers
3. Roles
4. Event assignment
5. Area assignment
6. Household assignment

### Result

Campaign activities और team structure connect होंगे।

---

# Phase 5 — Door-to-Door Visit

1. Household assignment
2. My Households
3. Visit creation
4. Visit status
5. Date/time
6. Notes
7. Revisit
8. Location verification

### Result

Field team actual field activity record कर सकेगी।

---

# Phase 6 — Offline System

1. Local records
2. Offline visit
3. Offline location verification
4. Sync queue
5. Retry
6. Conflict handling
7. Sync status

### Result

Field application unreliable internet पर भी काम करेगी।

---

# Phase 7 — Task & Issue Management

1. Task creation
2. Assignment
3. Due date
4. Status
5. Priority
6. Issue creation
7. Resolution

### Result

Campaign execution को track करना संभव होगा।

---

# Phase 8 — Campaign Progress Engine

अब नया data manually enter नहीं किया जाएगा।

System existing information से metrics निकालेगा:

**Households**

→ Visit progress

**Workers**

→ Assignment progress

**Events**

→ Campaign activity progress

**Tasks**

→ Execution progress

**Issues**

→ Operational readiness

---

# Phase 9 — Candidate Dashboard

Dashboard में:

### Organisation

Workers / Volunteers / Booths / Wards

### Field

Households / Visits / Revisit

### Campaign

Events / Tasks / Attendance

### Readiness

Booth assignment / reporting / pending issues

### Overall

Explainable campaign readiness

---

# Phase 10 — Reports

Reports:

- Event report
- Worker activity report
- Household visit report
- Booth progress
- Village progress
- Campaign activity report
- Pending task report
- Outstanding issue report
- Overall progress

Export options बाद में जोड़े जा सकते हैं।

---

# 41. Final Architecture

पूरा system अंततः इस तरह जुड़ेगा:

```text
CAMPAIGN
   │
   ├── EVENTS
   │     │
   │     ├── Responsible Person
   │     ├── Volunteers
   │     ├── Tasks
   │     ├── Attendance
   │     └── Documents
   │
   ├── ORGANISATION
   │     ├── Wards
   │     ├── Booths
   │     ├── Workers
   │     └── Volunteers
   │
   ├── HOUSEHOLDS
   │     │
   │     ├── Voters
   │     ├── Location
   │     ├── Assigned Worker
   │     └── Visits
   │
   ├── TASKS
   │
   ├── ISSUES
   │
   └── PROGRESS ENGINE
          │
          └── CANDIDATE DASHBOARD
```

---

# 42. Final User Journey

Candidate login करेगा:

### Dashboard

↓

**आज क्या हो रहा है?**

↓

Upcoming Events

↓

Field Progress

↓

Pending Tasks

↓

Outstanding Issues

↓

Campaign Readiness

और candidate किसी भी metric पर click करके:

**Constituency → Ward → Booth → Village → Household / Event / Worker**

तक जा सकेगा।

---

# 43. इस Project का अंतिम उद्देश्य

VoterAction का यह हिस्सा केवल:

> **“Events की list”**

या:

> **“Visited households की संख्या”**

नहीं होना चाहिए।

इसका उद्देश्य होना चाहिए:

> **Campaign में क्या plan किया गया था → किसे जिम्मेदारी दी गई → ground पर क्या हुआ → क्या pending है → कहाँ operational समस्या है → overall campaign readiness क्या है**

इन सभी को एक connected system में लाना।

इस architecture में पहले बनाए गए **Household Mapping & Field Verification module** का भी पूरा उपयोग होगा। इसलिए दोनों projects को अलग-अलग applications की तरह नहीं, बल्कि **एक ही VoterAction Campaign Operations Platform के interconnected modules** की तरह implement करना चाहिए।