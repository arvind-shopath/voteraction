# 📱 CreatiAV Multi-Platform App (Windows & Android)
## Complete Technical Specification & Functional Roadmap

### 1. Current State (What is already built)
Before moving to Apps, the system already has the following core engine:
- **Role-Based Access (RBAC):** Super Admin, Social Media Team, Panna Pramukh, etc.
- **Simulation Engine:** Super Admin can "Eye-view" any role from the floating dashboard.
- **Social Team Panel:** Centralized list of candidates and social platform cards.
- **Request Workflow:** Candidates can request posts; Team can approve/publish.
- **Content Library:** Management of posters, videos, and campaign materials.

---

### 2. Functional Workflow (How the App will work)

#### Step 1: Secure Login
- Users (Admin/Team) login via their unique credentials.
- The App identifies the user's role and pulls live data from the **Next.js Central Server**.

#### Step 2: Candidate Management (Sidebar)
- Team members see a sidebar with assigned candidates.
- Clicking a candidate loads their specific **Social Dashboard**.

#### Step 3: The "Magic" Social Launch (Windows/Android Speciality)
- **Launch Action:** When "Launch Facebook" is clicked:
    - **App Logic:** The app checks if a "Saved Session" exists in the cloud.
    - **In-Built Browser:** Instead of opening Chrome/Safari, the app opens a **Virtual Browser Window** inside itself.
    - **Isolation:** This window is a "Private Container"—it won't know about any other login on your PC/Mobile.

#### Step 4: Session Syncing (The "SessionBox" Feature)
- **Super Admin Role:** Logs into a platform (e.g., Rajesh's X.com) once.
- **Cloud Capture:** The app's "Session Bridge" captures the auth-tokens.
- **Sync:** These tokens are uploaded in an encrypted state to the server.
- **Instant Access for Team:** All authorized team members now see the "Launch" button as active. They click, and the candidate's account opens **without asking for a password**.

---

### 3. Key Platform Features

#### A. Windows Desktop App Features:
1. **Multi-Window Mode:** Open 5 candidates' dashboards in 5 separate windows at once.
2. **System Tray:** The app runs in the background; get instant alerts for new high-priority tasks.
3. **Session Injector:** Custom Chromium-based engine to handle cookie injection.

#### B. Android App Features:
1. **Direct Share to WhatsApp:** One-tap sharing of campaign posters to local worker groups.
2. **Push Notifications:** Real-time "Ding" when a candidate requests a new post.
3. **Mobile WebView Isolation:** Separate browser instances for each social platform.

---

### 4. Basic Server & Infrastructure
- **Server:** Existing Node.js/Next.js Backend (Central Logic).
- **API Bridge:** The Apps communicate via REST APIs & WebSockets for real-time sync.
- **Session DB:** A secure, encrypted table to store session blobs (auth keys).
- **Authentication:** JWT-based secure handshakes between Device and Server.

---

### 5. Roadmap (Phase-wise Execution)

**Phase 1: Hybrid Core (Immediate)**
- Wrap existing code in **Capacitor.js**.
- Build a test Android APK and Windows .EXE.

**Phase 2: Virtual Browser Implementation**
- Integrate Electron's `BrowserView` (Desktop) and Mobile `InAppBrowser`.
- Implement Session Isolation (Partitioning).

**Phase 3: The Sync Bridge**
- Develop the "Cookie Capture" module for Super Admin.
- Enable "One-Click Password-less Login" for the team.

---
**Document Status:** Final Specification v2.0
**Author:** Antigravity AI (Pair Programming with USER)
