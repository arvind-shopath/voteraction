# Election Management App – Functional Specification

## 1. Purpose of This Document

This document explains **what the application does and how it works**. It defines all modules, workflows, and rules so that backend, frontend, and mobile developers can implement the system **without additional explanations from the client**.

Target: **Local MLA Candidate – Uttar Pradesh**
Messaging/Calling features: **NOT REQUIRED**

---

## 2. System Overview

### Platforms

1. Android Mobile App (Field Workers, Booth Incharge, Social Team)
2. Web Application (Candidate, Campaign Manager, Admin)

### Core Principles

* Offline-first for mobile
* Booth-centric data model
* Role-based access
* Simple workflows

---

## 3. User Roles & Permissions

1. Candidate

   * View all dashboards
   * Submit social media input
   * Approve content

2. Campaign Manager

   * Full operational control
   * Assign booths/workers
   * View all reports

3. Booth Incharge

   * Manage assigned booth
   * Submit daily reports

4. Field Worker

   * Door-to-door data entry
   * Issue reporting

5. Social Media Team

   * Create/edit content
   * Schedule and publish posts

6. System Admin

   * User management
   * Data backup

---

## 4. Voter Management Module

### Functionality

* Import Electoral Roll (PDF/CSV)
* Assembly → Booth → Voter hierarchy
* Manual voter add/edit (restricted)

### Voter Fields

* Name
* Age
* Gender
* Booth Number
* EPIC (last 4 digits only)
* Mobile (optional)
* Support Status (Support / Neutral / Oppose)
* Notes

### Output

* Booth-wise voter lists
* Filtered voter views

---

## 5. Electoral Roll Update System

### Workflow

1. Admin imports latest ECI roll
2. System compares with previous roll
3. Flags:

   * New voters
   * Deleted voters
   * Booth changed voters
4. Auto re-map voters to booths
5. Maintain import history

### Rule

* No direct public API assumption
* Import-based sync only

---

## 6. Booth Management Module

### Functionality

* Booth master list
* Assign booth incharge
* Booth status tagging (Strong/Medium/Weak)

### Booth Dashboard

* Coverage percentage
* Last report date
* Risk indicator

---

## 7. Worker Management Module

### Functionality

* Worker registration
* Booth assignment
* Daily attendance
* Activity tracking

### Performance Score

Calculated using:

* Attendance
* Houses covered
* Report consistency

---

## 8. Field Work / Door-to-Door Module

### Mobile App (Offline)

* Daily activity form:

  * Booth
  * Houses visited
  * Issue category
  * Voter feedback
  * Optional photo

### Sync

* Local save when offline
* Auto sync when online

---

## 9. Issue & Complaint Tracking

### Fields

* Issue category
* Booth
* Priority (Low/Medium/High)
* Description
* Status (Open/In Progress/Closed)

### Views

* Booth-wise issues
* Top issues dashboard for candidate

---

## 10. Survey / Mood Tracking Module

### Survey Fields

* Vote preference
* Main issue

### Outputs

* Booth-wise survey summary
* Swing booth identification

---

## 11. Social Media Management Module

### Candidate Input

* Text input for daily activities
* Media upload

### Content Workflow

1. Draft created by social team
2. Candidate/Manager approval
3. Scheduled or instant publish

### Platforms

* Facebook
* Instagram
* X (Twitter)

### Analytics

* Post status
* Engagement summary

---

## 12. Poll Day Module

### Live Booth Reporting

* Turnout percentage updates
* Time-based reporting

### Incident Reporting

* Incident type
* Photo
* Timestamp
* Booth tag

---

## 13. Post-Election Module

### Functionality

* Upload booth-wise results
* Compare expected vs actual
* Worker performance summary

### Data Retention

* Preserve data for future elections

---

## 14. Reports & Export

* CSV / Excel export (restricted roles)
* Daily automatic backup
* Audit logs

---

## 15. Security & Compliance

* Role-based access control
* No bulk voter data export
* Activity logging
* Encrypted authentication

---

## 16. Non-Functional Requirements

* Hindi language default
* Simple UI labels
* Scalable architecture
* No dependency on paid messaging APIs

---

## Final Functional Statement

> **"The system must allow a Local MLA candidate to control voters, booths, workers, field activity, social media content, and poll-day operations from a single platform without messaging or calling features."**
