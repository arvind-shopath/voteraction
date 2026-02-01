\# Election Management Web App – UI Look \& Design Specification



\## 1. Purpose of This Document



This document describes \*\*how the web application should look\*\*. It defines the visual style, color codes, layout structure, and screen-wise design so that a UI/UX designer or frontend developer can build the interface \*\*without further clarification from the client\*\*.



Target user: \*\*Local MLA Candidate (Uttar Pradesh)\*\* and campaign team



Design philosophy:



> \*Simple, serious, control-room style. Not decorative. Not flashy.\*



---



\## 2. Overall Visual Personality



\* Professional, authoritative, calm

\* Similar feel to: Government dashboards / Election control rooms / News analytics panels

\* No party-color dominance (party color only for logo/header accent if needed)



---



\## 3. Color System (Strict)



\### Primary Colors



\* Primary Background: \*\*#0F172A\*\* (Dark Navy – authority \& trust)

\* Main Content Background: \*\*#FFFFFF\*\* (White – clarity)

\* Sidebar Background: \*\*#111827\*\* (Dark slate)



\### Status Colors (Critical)



\* Strong / Safe: \*\*#16A34A\*\* (Green)

\* Medium / Watch: \*\*#F59E0B\*\* (Amber)

\* Weak / Alert: \*\*#DC2626\*\* (Red)



\### Neutral UI Colors



\* Text Primary: \*\*#111827\*\*

\* Text Secondary: \*\*#6B7280\*\*

\* Border / Divider: \*\*#E5E7EB\*\*

\* Card Background: \*\*#F9FAFB\*\*



---



\## 4. Typography



\* Primary Font: \*\*Inter / Roboto / Noto Sans (Hindi supported)\*\*

\* Headings: Semi-bold

\* Body text: Regular

\* No decorative fonts



Font sizing guideline:



\* Page title: 20–22px

\* Section heading: 16–18px

\* Body text: 13–14px



---



\## 5. Layout Structure (Fixed)



\### A. Left Sidebar (Always Visible)



\* Width: ~260px

\* Dark background

\* White icons + text

\* Active menu highlighted with accent line



Menu order:



1\. Dashboard

2\. Voters

3\. Booths

4\. Workers

5\. Field Reports

6\. Issues

7\. Surveys

8\. Social Media

9\. Poll Day

10\. Reports

11\. Settings



Sidebar must \*\*never auto-hide\*\*.



---



\### B. Top Header (Thin)



\* Height: ~56px

\* Right side:



&nbsp; \* Candidate photo (small circle)

&nbsp; \* Candidate name

&nbsp; \* Logout

\* Left side:



&nbsp; \* Current phase indicator (Campaign / Poll Day / Post Poll)



---



\### C. Main Content Area



\* Card-based layout

\* Adequate spacing

\* No dense tables by default



---



\## 6. Dashboard Screen Design



\### Top KPI Cards (4)



\* Total Booths

\* Voter Coverage %

\* Weak Booths Count

\* Active Workers Today



Cards must be large, readable, color-coded.



\### Middle Section (2 columns)



\*\*Left Panel\*\*



\* Today’s Field Activity Summary

\* Booths with no report today



\*\*Right Panel\*\*



\* Top 5 Public Issues

\* System Alerts



\### Bottom Alerts Bar



\* Red/Amber alert strips for urgent items



---



\## 7. Voter Management Screen



\* Table layout with strong filters

\* Filters on top (Booth, Support Status, Area)

\* Each voter row:



&nbsp; \* Name

&nbsp; \* Booth

&nbsp; \* Support status (colored dot)

&nbsp; \* Notes icon



No raw Excel-like dense UI.



---



\## 8. Booth Management Screen



\* Toggle: Card View / List View



Booth Card shows:



\* Booth Number

\* Total Voters

\* Coverage %

\* Status color

\* Booth Incharge name



Weak booths must visually stand out.



---



\## 9. Worker Management Screen



\* Leaderboard-style list

\* Columns:



&nbsp; \* Worker name

&nbsp; \* Booth

&nbsp; \* Houses covered

&nbsp; \* Attendance %

&nbsp; \* Performance bar



Encourages accountability.



---



\## 10. Field Reports Screen



\* Date-wise expandable cards

\* Each card shows:



&nbsp; \* Booths covered

&nbsp; \* Issues raised

&nbsp; \* Photo thumbnails



Reading should be optional; insights should be visible.



---



\## 11. Issue / Complaint Screen



\* Kanban layout:



&nbsp; \* Open | In Progress | Closed



Issue card:



\* Issue icon

\* Booth

\* Priority color

\* Days pending



---



\## 12. Survey / Mood Screen



\* Simple bar charts

\* Swing booth list

\* Risk indicators



Avoid complex analytics visuals.



---



\## 13. Social Media Module – UI



\### Candidate Input Screen



\* Large text boxes:



&nbsp; \* "आज क्या किया"

&nbsp; \* "कल क्या करेंगे"

\* Media upload

\* Single submit button



\### Social Team Screen



\* Left: Content list (Draft / Approved / Published)

\* Right: Platform preview (FB / Insta / X)



Approval buttons must be obvious.



---



\## 14. Poll Day Screen (War Room)



\* Large booth list

\* Live turnout %

\* Blinking red alerts for low turnout

\* Incident popup alerts



This screen should be usable for 10+ continuous hours.



---



\## 15. UX Rules (Mandatory)



\* Hindi labels by default

\* No hidden actions

\* No long forms

\* Max 2 clicks to reach any feature

\* Design for non-technical users



---



\## Final UI Principle



> \*\*"The UI should reduce thinking, not add options."\*\*



