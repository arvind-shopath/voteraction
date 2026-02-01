# 🎯 Admin Todo List - Detailed Feature Requests

**Last Updated**: 2026-01-31 22:35:33

---

## ✅ COMPLETED FEATURES (Updated)

### 1. ✅ Worker Type System
- [x] **ग्राउंड कार्यकर्ता (FIELD Worker) व्यू** (#1)
  - Status: ✅ **COMPLETE**
  - Implementation: 
    - ViewContext में `effectiveWorkerType` support add किया
    - Sidebar में "Ground Worker View" option
    - WORKER role + FIELD type simulation
  - Location: `src/context/ViewContext.tsx`, `src/components/Sidebar.tsx`
  - **Test**: View As dropdown में अब दिखता है

### 2. ✅ Social Media Permissions
- [x] **सोशल मीडिया लिंक्स सेट करना - केवल Candidate/Admin** (#22)
  - Status: ✅ **COMPLETE**
  - बूठ मैनेजर/पन्ना प्रमुख/ग्राउंड कार्यकर्ता नहीं कर सकते
  - Location: `src/app/(app)/social/page.tsx` - `canSetLinks` permission

- [x] **नई पोस्ट तैयार करना - केवल Candidate** (#22)
  - Status: ✅ **COMPLETE**
  - बूठ मैनेजर को यह option नहीं दिखता
  - Location: `src/app/(app)/social/page.tsx` - `canCreateOfficialPost`

- [x] **प्रचार सामग्री - Workers को view only** (#22, #24)
  - Status: ✅ **COMPLETE**
  - सभी workers को प्रचार सामग्री देख और share कर सकते हैं
  - Upload सिर्फ Social Media Team कर सकती है

### 3. ✅ Task Management
- [x] **कैंडिडेट को टास्क देने का ऑप्शन** (#12, #19)
  - Status: ✅ **COMPLETE**
  - Task name, description, media upload, worker assignment
  - Location: `src/app/(app)/tasks/page.tsx`

### 4. ✅ Jansampark (Route Planning)
- [x] **कैंडिडेट का रूट प्लान सभी को दिखना** (#17)
  - Status: ✅ **COMPLETE**
  - सभी workers को Candidate Route tab दिखता है
  - Location: `src/app/(app)/jansampark/page.tsx`

### 5. ✅ Worker Login System
- [x] **कार्यकर्ता लॉगइन (Mobile + Password)** (#28)
  - Status: ✅ **COMPLETE**
  - Mobile number = User ID
  - Candidate/Admin password set कर सकते हैं
  - Location: `src/app/(app)/workers/page.tsx`

### 6. ✅ Panna Pramukh Voters
- [x] **पन्ना प्रमुख को assigned voters** (#10)
  - Status: ✅ **COMPLETE**
  - "आपका पन्ना" filter exists
  - Location: `src/app/(app)/voters/page.tsx?filter=my-panna`

### 7. ✅ Worker Soft Delete
- [x] **Worker delete करने पर data preserve** (User Request)
  - Status: ✅ **COMPLETE**
  - Database: `deletedAt` field in Worker model
  - Functions: `deleteWorker()`, `getActiveWorkers()`, `restoreWorker()`
  - Worker का सारा data (tasks, voters, jansampark) preserve रहता है
  - Location: `prisma/schema.prisma`, `src/app/actions/worker.ts`

### 8. ✅ Social Media Team Members (Admin Level)
- [x] **4 Social Media Team Members Created**
  - Status: ✅ **COMPLETE**
  - Members:
    - Vivek Singh - Social Media Manager (vivek.social@voteraction.com)
    - Prateek Shukla - Social Media Manager (prateek.social@voteraction.com)
    - Abid Hasan - Graphics Designer (abid.graphics@voteraction.com)
    - Vishal Shukla - Video Editor (vishal.video@voteraction.com)
  - Password: `Voteraction@2027`
  - Assembly: NULL (Admin-level team, no specific candidate)

---

## 🔴 PENDING / IN PROGRESS

### PRIORITY 1 - Critical Fixes

#### P1.1 - Assembly Management (Admin Scope)
- [ ] **पिछले चुनाव के आंकड़े - Admin fills** (#2)
  - Current: Dashboard में show होता है
  - Required: Admin Assembly Management में भरे
  - **ANSWER PROVIDED**: साल के हिसाब से डेटा एंट्री - कम से कम 2 चुनावों की एंट्री
  - **Format**: Year + (बाकी वही fields जो अभी हैं)
  - **Status**: 🔴 Pending Implementation

- [ ] **विधानसभा का जाति समीकरण - Admin fills** (#3)
  - Current: Caste equation data hardcoded/auto-calculated
  - Required: Admin Assembly Management में editable
  - **Status**: 🔴 Pending Implementation

#### P1.2 - Booth Manager Restrictions
- [ ] **बूठ मैनेजर को सिर्फ उसकी टीम दिखनी चाहिए** (#4)
  - Current: सभी workers दिख रहे हैं
  - Required: केवल उसके booth के workers
  - **Status**: 🔴 Pending

- [ ] **बूठ मैनेजर को edit rights नहीं** (#25)
  - Current: Check करना है
  - Required: सिर्फ view only, edit केवल Admin/Candidate
  - **Status**: 🔴 Pending

#### P1.3 - Issues Filtering
- [ ] **समस्या रिपोर्ट - booth-wise filtering** (#5)
  - Current: सभी issues दिख रहे हैं
  - Required: बूठ मैनेजर को सिर्फ उसके booth की
  - Required: किसने edit किया - show करना है
  - **Status**: 🔴 Pending

- [ ] **पन्ना प्रमुख को relevant issues only** (#13)
  - Current: सभी assembly की problems
  - Required: सिर्फ उसे भेजी गई issues
  - **Status**: 🔴 Pending

### PRIORITY 2 - Social Media Enhancements

#### P2.1 - Worker Social Media Features
- [ ] **Workers को Candidate के posts share करने का feature** (#6a, #6c)
  - View candidate's social posts
  - Like/Share buttons with WhatsApp integration
  - Follow Candidate's profile option
  - Track as completed task
  - **Status**: 🔴 Pending

- [ ] **प्रचार सामग्री - Date-wise display** (#6b)
  - आज की प्रचार सामग्री default
  - पिछले 1 हफ्ते की देख सकें
  - उससे ज्यादा नहीं
  - **Status**: 🔴 Pending

- [ ] **Share/Like/Follow tracking as Task** (#6c, #9)
  - Post share करना = task complete
  - Like करना = task complete
  - Follow status track करना
  - **Status**: 🔴 Pending

#### P2.2 - Social Media Team Features
- [ ] **Social Media Team - प्रचार सामग्री upload** (#15)
  - Currently: केवल view
  - Required: Upload/Create campaign material
  - **Status**: 🔴 Pending

- [ ] **Social Media Team - नई पोस्ट के लिंक add** (#15)
  - Add live post links
  - Workers को share/like के लिए दिखें
  - **Status**: 🔴 Pending

- [ ] **Social Media Team - Multiple Candidates** (#16)
  - Switch between different candidates
  - Example: लहरपुर (रामलाल) ↔️ सिकटा (संमृद्ध वर्मा)
  - **ANSWER PROVIDED**: 
    - अगर Candidate ने खुद बनाई = Switch option नहीं
    - अगर Admin ने assign की = Dashboard पर पहले Candidate select करना होगा
    - विधानसभा selector की जगह Candidate selector होगा
  - **Status**: 🔴 Pending

- [ ] **Social Dashboard - Enhanced tracking** (#14)
  - कौन से worker ने like/share किया
  - कौन को करना बाकी है
  - Follower status tracking
  - **Status**: 🔴 Pending

### PRIORITY 3 - Panna Pramukh Enhancements

- [ ] **"मेरा बूठ" option - पन्ना प्रमुख के लिए** (#23)
  - मेरा पन्ना: assigned 50-100 voters only
  - मेरा बूठ: पूरे booth के voters
  - **Status**: 🔴 Pending

- [ ] **पन्ना प्रमुख को प्रचार सामग्री** (#11, #23)
  - Status: Currently missing
  - Required: Same features as Booth Manager
  - **Status**: 🔴 Pending
  
- [ ] **Configurable Panna Size** (#23)
  - Candidate choose कर सके: 50 या 100 voters per Panna
  - **Status**: 🔴 Pending

### PRIORITY 4 - Booth Management

- [ ] **Search functionality** (#21)
  - Booth number, village name से search
  - **Status**: 🔴 Pending

- [ ] **Filters** (#21)
  - Status: फेवर / एंटी / सामान्य
  - Caste: किस जाति की बहुलता
  - Assignment: Assigned / Not Assigned
  - **Status**: 🔴 Pending

- [ ] **List View Fix** (#21)
  - Current: काम नहीं कर रहा
  - Required: Debug और fix करना है
  - **Status**: 🔴 Pending

### PRIORITY 5 - Jansampark Updates

- [ ] **Route Edit After Visit** (#26)
  - दौरा खत्म होने के बाद edit option
  - Atmosphere update: पक्ष/विपक्ष/सामान्य
  - पूरी app में connected होना चाहिए
  - **Status**: 🔴 Pending

- [ ] **कार्यकर्ताओं का जनसंपर्क - Individual tracking** (#18)
  - **ANSWER PROVIDED**: Voter-wise individual contact tracking
  - बूठ मैनेजर: किस voter से मिला (not किस गांव)
  - पन्ना प्रमुख: assigned voters में से किससे मिला
  - **UI SUGGESTION NEEDED**: 
    - Option 1: Dropdown/Search से voter select करें
    - Option 2: Assigned voters की list में checkboxes
    - Option 3: Quick contact log form (Date, Voter, Notes, Atmosphere)
  - **Status**: 🔴 Pending - UI approval needed

### PRIORITY 6 - UI/UX Improvements

- [ ] **मतदाता सूची - गांव के नाम fix** (#27)
  - Current: रामपुर शिवपुर (गलत)
  - Required: सही गांव के नाम
  - **Status**: 🔴 Pending

- [ ] **Booth Selection - Arrow बड़ा** (#27)
  - Select करने में मुश्किल हो रहा है
  - Dropdown arrow size बढ़ाना
  - **Status**: 🔴 Pending

- [ ] **Workers Hierarchy View** (#21)
  - **ANSWER PROVIDED**: Simple list चाहिए (NOT tree view)
  - कैंडिडेट → (Booth Manager, Field Worker) → Panna Pramukh
  - **Status**: 🔴 Pending

### PRIORITY 7 - Documentation

- [ ] **App Documentation (#20)**
  - App की functioning
  - सभी features की list
  - हर user role क्या कर सकता है
  - Done/Pending task tracking
  - Presentation के लिए reference
  - **Status**: 🔴 Pending

---

## 💡 USER ANSWERS TO QUESTIONS

### Q1: कार्यकर्ताओं का जनसंपर्क (#18)
**Answer**: ✅ Voter-wise individual contact tracking होगी

**UI Options to Present**:
1. **Voter Search & Select**: Dropdown/autocomplete से voter search
2. **Quick Contact Form**:
   - Date (default: today)
   - Voter selection (from assigned list)
   - Met/Not Met checkbox
   - Notes (optional)
   - Atmosphere: पक्ष/विपक्ष/सामान्य
3. **Contact History**: Previous contacts की list

**Waiting for**: UI approval

---

### Q2: Assembly Management में Historical Election Data (#2,#3)
**Answer**: ✅ साल के हिसाब से डेटा एंट्री

**Format**:
- Year (Election Year) - Primary field
- फिर बाकी सभी fields (जो अभी हैं):
  - Candidate Name
  - Party
  - Votes Received
  - Vote %
  - Result (Won/Lost)
  - Margin
- **Minimum**: 2 चुनावों की entries

**Implementation Plan**:
1. Create `ElectionHistory` model in Prisma
2. One-to-many relation: Assembly → ElectionHistory
3. Admin Assembly Management में multi-entry form

---

### Q3: Workers Hierarchy (#21)
**Answer**: ✅ Simple list चाहिए (NOT tree view)

**Implementation**:
- Simple table/card list with indentation
- Format:
  ```
  📊 कैंडिडेट
    ├── 👷 Booth Manager (Booth 1)
    │   └── 📋 Panna Pramukh (10 voters)
    ├── 🚶 Field Worker
  ```

---

### Q4: Social Media Multiple Candidates (#16)
**Answer**: ✅ Candidate selector in Social Dashboard

**Logic**:
1. **If** Candidate ने खुद Social Media Team बनाई:
   - No switch option
   - सीधे उसी candidate का data
   
2. **If** Admin ने Social Media Team assign की:
   - Dashboard open होते ही Candidate selector दिखेगा
   - Assembly selector की जगह Candidate selector
   - पहले Candidate select → फिर data दिखेगा

**Implementation Plan**:
1. Check `socialMediaTeam.assemblyId === null` → Admin-level team
2. Show Candidate dropdown if admin-level
3. Store selected candidateId in state/cookie

---

## ✅ PROGRESS SUMMARY
- **Database Schema**: COMPLETE (5 New Models Created)
- **Candidate Post Form**: COMPLETE (Enhanced UI + Server Actions)
- **Social Media Dashboard**: COMPLETE (Pending Requests + Publish Workflow)
- **Worker Task UI**: COMPLETE (Task Listing + Action Buttons)
- **Auto-Task Logic**: COMPLETE (Triggered on Publish)

## ⚠️ PENDING
- **Worker Proof Upload**: UI needs file input handling
- **Metrics Dashboard**: Admin view for total likes/shares
- **Campaign Material Upload**: UI exists but needs integration with new flow

## 📝 NEXT STEPS (PRIORITY)
1. **Implement Proof Upload** modal for workers (Pending)
2. **Build Metrics Dashboard** (Pending)
3. **Verify Date Filter** usability (Date picker currently in Media section)ed

---

## 🎯 RECOMMENDED NEXT STEPS

Based on priority and dependencies:

### **STEP 1**: Assembly Historical Data (P1.1)
- Create ElectionHistory model
- Admin form for data entry
- Impact: Foundation for analytics

### **STEP 2**: Booth Manager Restrictions (P1.2)
- Filter workers by booth
- Remove edit rights
- Impact: Security & data integrity

### **STEP 3**: Workers Individual Jansampark (P5)
- Get UI approval first
- Implement voter contact tracking
- Impact: Core worker functionality

### **STEP 4**: Social Media Candidate Selector (P2.2)
- Enable multi-candidate support
- Impact: Scalability for admin-level social team

---

**Notes**: 
- All user answers documented above
- Green ticks (✅) added to completed items
- Priority order может adjust based on user feedback
- UI suggestions pending approval for Jansampark individual tracking

---

## 🚀 NEW FEATURE: COMPLETE SOCIAL MEDIA WORKFLOW

**Added**: 2026-01-31 23:06:58  
**Status**: 🔄 **IN PROGRESS** - Database ✅ Complete, UI Implementation pending

### 📋 **Workflow Overview:**

```
CANDIDATE → Post Request → SOCIAL MEDIA TEAM → Accept & Post → URLs Added → 
AUTO TASK CREATION → WORKERS → Like/Share/Comment → PROOF UPLOAD → 
SOCIAL MEDIA DASHBOARD → Metrics Tracking
```

---

### ✅ **COMPLETED: Database Schema** (5 New Models)

#### 1. **CandidatePostRequest** ✅
**Purpose**: Candidate अपनी post requirements submit करता है

**Fields**:
- `subject` (विषय)
- `location` (स्थान)
- `importantPeople` (JSON array - comma-separated input with chips)
- `description` (optional details)
- `photoUrls` (JSON array of uploaded photos)
- `videoUrls` (JSON array of uploaded videos)
- `status`: PENDING → ACCEPTED → PUBLISHED
- `facebookUrl`, `twitterUrl`, `instagramUrl`, `whatsappUrl` (added by Social Media Team)
- `publishedAt` (timestamp)

**Relations**:
- `creator`: Candidate (User)
- `acceptor`: Social Media Team member (User)
- `workerTasks`: Auto-created WorkerSocialTask[]

---

#### 2. **SocialMediaApproval** ✅
**Purpose**: Social Media Team → Candidate approval workflow

**Fields**:
- `title` (Content description)
- `contentType`: "PHOTO" | "VIDEO"
- `mediaUrls` (JSON array of created content)
- `notes` (for candidate)
- `status`: PENDING → APPROVED/REJECTED
- `rejectionReason` (if rejected)
- `postedUrls` (JSON: {facebook, twitter, instagram} after posting)
- `postedAt` (timestamp)

**Relations**:
- `creator`: Social Media Team member
- `approver`: Candidate

---

#### 3. **CampaignMaterial** ✅
**Purpose**: Digital प्रचार सामग्री (photos/videos) by Social Media Team

**Fields**:
- `title`
- `description`
- `materialType`: "PHOTO" | "VIDEO" | "GRAPHIC"
- `fileUrls` (JSON array)
- `platform`: "WHATSAPP" | "FACEBOOK" | "INSTAGRAM" | "ALL"
- `expiresAt` (optional - for time-sensitive content)

**Relations**:
- `creator`: Social Media Team member
- `workerTasks`: WorkerSocialTask[] (for distribution)

---

#### 4. **WorkerSocialTask** ✅
**Purpose**: Worker को automatically assigned tasks

**Task Types**:
1. **POST_ENGAGEMENT**: Like/Share/Comment on candidate posts
2. **MATERIAL_SHARE**: Share campaign material on WhatsApp/Social Media

**Fields**:
- `taskType`
- `dueDate` (24 hours from creation)
- **POST_ENGAGEMENT Tracking**:
  - `liked`, `likedAt`
  - `shared`, `sharedAt`
  - `commented`, `commentedAt`
- **MATERIAL_SHARE Tracking**:
  - `sharedOnWhatsapp`
  - `sharedOnFacebook`
  - `sharedOnInstagram`
- `status`: PENDING → IN_PROGRESS → COMPLETED/OVERDUE

**Relations**:
- `worker`: Worker
- `postRequest`: CandidatePostRequest (if POST_ENGAGEMENT)
- `campaignMaterial`: CampaignMaterial (if MATERIAL_SHARE)
- `proofs`: WorkerSocialTaskProof[]

---

#### 5. **WorkerSocialTaskProof** ✅
**Purpose**: Screenshot proofs (AUTO-DELETE after 3 days)

**Fields**:
- `proofType`: "LIKE" | "SHARE" | "COMMENT" | "WHATSAPP_SHARE"
- `screenshotUrl`
- `createdAt`
- `expiresAt` (createdAt + 3 days)

**Auto-Delete Job**: Cron job to delete proofs older than 3 days

---

### 📝 **COMPLETE USER REQUIREMENTS:**

#### **Candidate Post Submission Flow**:
1. ✅ Candidate fills form:
   - विषय (Subject)
   - स्थान (Location)
   - महत्वपूर्ण लोग (Comma-separated with chip display)
   - फोटो अपलोड (Multiple photos)
   - वीडियो अपलोड (Multiple videos)

2. ✅ Status: PENDING (जब तक Social Media Team react नहीं करती)

3. ✅ Social Media Team को:
   - In-app notification ✅
   - Popup notification (until accepted) 🔴 Pending UI

#### **Social Media Team Actions**:
1. 🔴 View pending requests
2. 🔴 Accept request (status → ACCEPTED)
3. 🔴 Post content on Facebook/Twitter/Instagram
4. 🔴 Add URLs (separate for each platform):
   - Facebook URL
   - Twitter URL
   - Instagram URL
   - WhatsApp URL (optional)
5. ✅ Auto-create worker tasks (database triggers ready)

#### **Worker Tasks (Auto-Created)**:
1. ✅ Task Type: POST_ENGAGEMENT
2. ✅ Due: 24 hours
3. 🔴 Worker View:
   - See post preview
   - Like button (opens link → screenshot proof)
   - Share button (WhatsApp/Facebook)
   - Comment button
   - Upload 3 screenshots (like, share, comment)
4. ✅ Screenshot auto-delete: 3 days

#### **Social Media Dashboard (Metrics)**:
1. 🔴 Total workers assigned
2. 🔴 Completed count (किसने like/share/comment किया)
3. 🔴 Pending count
4. 🔴 Individual worker details table:
   - Worker name
   - Liked? (✓/✗)
   - Shared? (✓/✗)
   - Commented? (✓/✗)
   - Proof screenshots (view)

#### **Approval Workflow (Social Media → Candidate)**:
1. 🔴 Social Media Team creates content (photo/video)
2. 🔴 Submits for approval
3. 🔴 Candidate sees notification
4. 🔴 Candidate approves/rejects
5. 🔴 If approved → Social Media Team posts → adds URLs

#### **Campaign Material Distribution**:
1. 🔴 Social Media Team uploads photos/videos
2. 🔴 Selects platform (WhatsApp/Facebook/Instagram/All)
3. 🔴 Auto-creates MATERIAL_SHARE tasks for all workers
4. 🔴 Workers download & share on their social media

---

### 🎯 **IMPLEMENTATION CHECKLIST:**

#### **Phase 1: Candidate Flow** (Current Focus)
- [ ] **Candidate Post Request Form** 🔄 IN PROGRESS
  - [ ] Subject input
  - [ ] Location input
  - [ ] Important People input (comma-separated with chips)
  - [ ] Photo upload (multiple)
  - [ ] Video upload (multiple)
  - [ ] Submit → Status: PENDING
  - Location: `/app/(app)/social/page.tsx` (modify existing form)

- [ ] **Candidate Post History View**
  - [ ] List of all submitted posts
  - [ ] Status indicators (PENDING/ACCEPTED/PUBLISHED)
  - [ ] View details

#### **Phase 2: Social Media Team Flow**
- [ ] **Pending Requests Dashboard**
  - [ ] List view of all PENDING posts
  - [ ] In-app notification system
  - [ ] Persistent popup (until accepted)
  - [ ] Accept button → Status: ACCEPTED

- [ ] **Post URL Entry Form**
  - [ ] Facebook URL input
  - [ ] Twitter URL input
  - [ ] Instagram URL input
  - [ ] WhatsApp URL input (optional)
  - [ ] Submit → Status: PUBLISHED
  - [ ] **Auto-trigger**: Create WorkerSocialTask for all workers

- [ ] **Campaign Material Upload**
  - [ ] Title, description
  - [ ] Material type selection
  - [ ] File upload (photos/videos)
  - [ ] Platform targeting
  - [ ] Submit → Auto-create tasks

- [ ] **Approval Requests (Team → Candidate)**
  - [ ] Create approval request
  - [ ] Upload content
  - [ ] Add notes
  - [ ] Submit for approval

#### **Phase 3: Worker Flow**
- [ ] **Social Media Tasks View**
  - [ ] List of assigned tasks
  - [ ] Task type indicators
  - [ ] Due date countdown
  - [ ] Overdue warnings

- [ ] **POST_ENGAGEMENT Task Interface**
  - [ ] Post preview (embedded or link)
  - [ ] Action buttons:
    - [ ] "लाइक करें" → Opens link → Upload screenshot
    - [ ] "शेयर करें" → WhatsApp/Facebook → Upload screenshot
    - [ ] "कमेंट करें" → Opens link → Upload screenshot
  - [ ] Screenshot upload (max 3)
  - [ ] Mark complete

- [ ] **MATERIAL_SHARE Task Interface**
  - [ ] Material preview
  - [ ] Download button
  - [ ] Share tracking checkboxes
  - [ ] Proof upload

#### **Phase 4: Metrics & Analytics**
- [ ] **Social Media Dashboard**
  - [ ] Worker engagement table
  - [ ] Completion statistics
  - [ ] Individual worker drill-down
  - [ ] Proof screenshot gallery
  - [ ] Export to Excel

- [ ] **Candidate Approval Dashboard**
  - [ ] Pending approvals from Social Media Team
  - [ ] Approve/Reject interface
  - [ ] Approval history

#### **Phase 5: Automation & Cleanup**
- [ ] **Auto-Task Creation**
  - [ ] Trigger when post URLs added
  - [ ] Assign to all active workers
  - [ ] Set 24-hour deadline

- [ ] **Screenshot Auto-Delete Cron Job**
  - [ ] Daily cleanup job
  - [ ] Delete proofs older than 3 days
  - [ ] Log deletions

- [ ] **Notification System**
  - [ ] In-app notifications
  - [ ] Persistent popups
  - [ ] Email notifications (optional)

---

### 🔧 **TECHNICAL DETAILS:**

**Database**: ✅ Complete
- 5 new models added to Prisma schema
- All relations configured
- Indexes for performance

**API Actions Needed**:
```typescript
// Candidate actions
- createPostRequest()
- getMyPostRequests()
- approveContent()
- rejectContent()

// Social Media Team actions
- getPendingPostRequests()
- acceptPostRequest()
- addPostURLs()
- uploadCampaignMaterial()
- createApprovalRequest()

// Worker actions
- getMySocialTasks()
- uploadTaskProof()
- markTaskComplete()

// Admin/Metrics
- getSocialEngagementMetrics()
- getWorkerEngagementDetails()
```

**Files to Create/Modify**:
1. `/app/(app)/social/page.tsx` - Modify candidate form
2. `/app/(app)/social/requests/page.tsx` - Social Media Team pending requests
3. `/app/(app)/social/approvals/page.tsx` - Candidate approvals
4. `/app/(app)/social/materials/page.tsx` - Campaign material management
5. `/app/(app)/social/tasks/page.tsx` - Worker tasks view
6. `/app/actions/socialMedia.ts` - All server actions
7. `/lib/notifications.ts` - Notification system

---

## 📊 **UPDATED PROGRESS SUMMARY**

**Total Major Features**: 32 (+ Social Media Workflow)

**Status Breakdown**:
- ✅ **Completed**: 9 features (28%)
  - Added: Social Media Workflow Database Schema
- 🔄 **In Progress**: 1 feature (3%)
  - Social Media Workflow UI Implementation
- 🔴 **Pending**: 22 features (69%)

**Latest Update** (31-Jan-2026 23:06):
1. ✅ Social Media Workflow Database Models (5 models)
2. 🔄 Candidate Post Request Form - Starting implementation

---

**Next Immediate Task**: 
Implementing Candidate Post Request Form with chips for "Important People" field.

