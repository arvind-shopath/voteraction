इसी एप्प में एक और फीचर add करना है, एडमिन को अपने सभी क्लाइंट के सोशल मीडिया अकाउंट्स को मैनेज करना है, सुपर एडमिन के अलावा बाकी एडमिन भी टीम माने जाएंगे.. नाम रहेगा creatiav Social

# 📘 PROJECT SPECIFICATION

## Multi-Leader Social Media Management Web App

*(Human-operated, No Automation, No Bots)*

---

## 1. Project Objective

Build a **single web application** that allows a team to **manually manage multiple leaders’ social media accounts (Facebook, Twitter/X, Instagram)** from one interface, without repeated login/logout, and without violating platform policies.

**Key Constraints:**

* ❌ No auto-posting
* ❌ No bots / scripts
* ❌ No session sharing across users
* ✅ Human-only usage
* ✅ Legal & platform-safe

NaMo App is **out of scope (Phase-0 excluded)**.

---

## 2. User Roles

### 2.1 App Owner (Super Admin)

* Creates leaders
* Manages team
* Assigns leaders to team members
* Full access

### 2.2 Team Member

* Logs into app
* Access only assigned leaders
* Uses social media manually

---

## 3. Core Concept (Critical for Developer)

### Session Rule (DO NOT VIOLATE)

```
Session = (Team Member × Leader × Platform)
```

* Sessions are **NOT shared** between team members
* Each team member logs into FB/X/IG **once per leader**
* Session persists until platform expires it
* No cookie export/import
* No password storage

---

## 4. Functional Modules

---

### 4.1 Authentication Module

**Features:**

* Email + password login
* JWT / session-based auth
* Roles: OWNER, ADMIN, MEMBER

**Requirements:**

* No social media credentials stored
* App auth completely separate from platform auth

---

### 4.2 Leader Management Module

**Leader Entity Fields:**

* Leader ID
* Full Name
* Party Name
* Constituency / Area
* Photo / Party Logo
* Status (Active / Archived)

**Actions:**

* Create leader
* Edit leader
* Archive leader

---

### 4.3 Team Management Module

**Team Member Fields:**

* Name
* Email
* Role
* Assigned Leaders (many-to-many)

**Permissions:**

* Owner assigns leaders
* Team member can only see assigned leaders

---

### 4.4 Social Platform Container Module (CORE)

**Supported Platforms (Phase-1):**

* Facebook
* Twitter (X)
* Instagram

**Important Technical Notes for Developer:**

* ❌ iframe NOT allowed (blocked by platforms)
* Use **isolated browser containers / webviews**
* Each container must have:

  * Separate cookie store
  * Separate local storage
  * Separate IndexedDB

**First-Time Flow:**

1. User selects Leader
2. Selects platform (FB/X/IG)
3. Platform login screen appears
4. User logs in manually
5. Session persists

**Subsequent Visits:**

* Platform opens already logged-in
* No re-login unless expired

---

## 5. Application Flow (End-to-End)

### 5.1 First-Time Setup

1. Owner logs in
2. Creates leaders
3. Adds team members
4. Assigns leaders to team
5. Owner / team member logs into platforms ONCE

---

### 5.2 Daily Usage Flow

1. User logs into app
2. Selects leader from sidebar
3. Platform tabs appear:

   * Facebook
   * Twitter
   * Instagram
4. User posts / comments / replies manually
5. Switch leader → different sessions load

---

## 6. UI / UX SPECIFICATION

---

### 6.1 Desktop Layout (Primary)

```
----------------------------------------------------
Top Bar:
- App Name
- Logged-in User
- Logout
----------------------------------------------------
Left Sidebar:
- Leader List (cards)
----------------------------------------------------
Main Area:
- Leader Header (Name, Party, Area, Logo)
- Platform Tabs (FB | X | IG)
- Active Platform Web Container
----------------------------------------------------
```

**UX Rules:**

* Leader switching must be instant
* Platform tabs remember last active state
* No popups unless session expired

---

### 6.2 Mobile UI (Responsive)

* Leader selection → vertical list
* Platform buttons → bottom bar / side drawer
* Platform opens full screen
* Back → leader dashboard

Mobile must feel like **native social browsing**, not iframe.

---

## 7. Security & Compliance Rules (MANDATORY)

* ❌ No storing platform passwords

* ❌ No cookie cloning

* ❌ No cross-user session reuse

* ❌ No automation triggers

* ❌ No headless browsers

* ✅ HTTPS only

* ✅ Encrypted app sessions

* ✅ Audit logs (basic)

---

## 8. Database Design (High-Level)

### Tables (Indicative)

* users
* roles
* leaders
* leader_assignments
* platform_sessions (metadata only, no cookies)
* activity_logs

**Note:**
Platform session data must stay in browser context, **not DB**.

---

## 9. Technology Stack (Recommended)

### Frontend

* Next.js (React)
* Responsive (desktop-first, mobile-friendly)

### Backend

* Node.js
* PostgreSQL

### Session Handling

* Browser-level storage isolation
* Per-user, per-leader containers

---

## 10. Development Phases

### Phase 1 – Core App (Week 1)

* Auth
* Leader CRUD
* Base UI

### Phase 2 – Social Containers (Week 2)

* FB/X/IG integration
* Session persistence
* Leader switching

### Phase 3 – Team System (Week 3)

* Team roles
* Leader assignments
* Permission checks

### Phase 4 – Mobile UX & Stability (Week 4)

* Responsive UI
* Edge cases
* Performance fixes

---

## 11. Explicit Non-Goals (Developer Must NOT Implement)

* ❌ Auto posting
* ❌ Scheduled posting
* ❌ Bots
* ❌ Session export/import
* ❌ Password managers

---

## 12. Success Criteria

The app is successful if:

* A team member logs into app
* Selects a leader
* Facebook/X/Instagram open already logged-in
* User works manually
* Switches leader without logout
* No platform bans or security flags

---

## 13. Final Instruction to Developer

> “This is a **manual social media operating dashboard**,
> not an automation tool.
> Follow platform security models strictly.”

