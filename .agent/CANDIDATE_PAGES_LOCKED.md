# 🔒 CANDIDATE PAGES - LOCKED & FINALIZED

**Status**: ✅ **LOCKED** - Do not modify without explicit approval  
**Date Locked**: 2026-02-01  
**Role**: MANAGER (Candidate)

---

## ⚠️ IMPORTANT NOTICE

These pages have been **finalized and locked** as per user requirement. Any modifications to the candidate (MANAGER) pages, menu structure, or functionality must be explicitly approved by the project owner before implementation.

---

## 📋 CANDIDATE MENU STRUCTURE (FINAL)

The following menu order is **LOCKED** and must not be changed:

1. **कैंडिडेट डैशबोर्ड** (Dashboard) - `/dashboard`
2. **मतदाता सूची** (Voter List) - `/voters`
3. **बूथ प्रबंधन** (Booth Management) - `/booths`
4. **कार्यकर्ता & टीम** (Workers & Team) - `/workers`
5. **टास्क मैनेजमेंट** (Task Management) - `/tasks`
6. **समस्याएं (Issues)** - `/issues`
7. **सोशल मीडिया** (Social Media) - `/social`
8. **जनसंपर्क (PR)** (Public Relations) - `/jansampark`
9. **सेटिंग्स & ब्रांडिंग** (Settings & Branding) - `/settings`

**File**: `/var/www/voteraction/src/components/Sidebar.tsx` (Lines 79-90)

---

## 📄 LOCKED PAGES & FEATURES

### 1. Dashboard (`/dashboard`)
**File**: `/var/www/voteraction/src/app/(app)/dashboard/page.tsx`

**Features** (LOCKED):
- Assembly selection dropdown
- Live statistics (Voters, Booths, Workers, Tasks)
- Booth Analysis with sentiment indicators
- Caste Analytics (pie chart)
- Age Distribution (bar chart)
- Historical Election Results with:
  - Year-based tabs
  - Party logos display
  - Winning margin calculation
  - Sorted results by votes
- Booth Sentiment (Top 5 Positive)
- Jansampark Feedback integration

**Critical Elements**:
- Party logo configuration in `/var/www/voteraction/src/lib/constants.ts`
- Historical data display with proper party name mapping
- All chart visualizations and data processing logic

### 2. Voter List (`/voters`)
**File**: `/var/www/voteraction/src/app/(app)/voters/page.tsx`

**Features** (LOCKED):
- Voter search and filtering
- Booth-wise voter grouping
- Voter details with contact information
- Panna assignment functionality
- Export capabilities

### 3. Booth Management (`/booths`)
**File**: `/var/www/voteraction/src/app/(app)/booths/page.tsx`

**Features** (LOCKED):
- Booth listing and management
- Booth-level statistics
- Booth manager assignment
- Sentiment tracking per booth

### 4. Workers & Team (`/workers`)
**File**: `/var/www/voteraction/src/app/(app)/workers/page.tsx`

**Features** (LOCKED):
- Worker hierarchy display
- Worker type management (BOOTH_MANAGER, PANNA_PRAMUKH, FIELD)
- Task assignment to workers
- Worker performance tracking

### 5. Task Management (`/tasks`)
**File**: `/var/www/voteraction/src/app/(app)/tasks/page.tsx`

**Features** (LOCKED):
- Task creation and assignment
- Task status tracking
- Priority management
- Progress monitoring

### 6. Issues (`/issues`)
**File**: `/var/www/voteraction/src/app/(app)/issues/page.tsx`

**Features** (LOCKED):
- Issue reporting and tracking
- Constituency issue management
- Status updates and resolution tracking

### 7. Social Media (`/social`)
**File**: `/var/www/voteraction/src/app/(app)/social/page.tsx`

**Features** (LOCKED):
- Social media content management
- Content approval workflow
- Platform-wise posting
- Analytics integration

### 8. Jansampark (PR) (`/jansampark`)
**File**: `/var/www/voteraction/src/app/(app)/jansampark/page.tsx`

**Features** (LOCKED):
- Public relations route management
- Contact tracking
- Feedback collection
- Route-wise reporting

### 9. Settings & Branding (`/settings`)
**File**: `/var/www/voteraction/src/app/(app)/settings/page.tsx`

**Features** (LOCKED):
- Profile management
- Candidate branding (name, photo)
- Assembly information display
- Visual customization

---

## 🔐 LOCKED CONFIGURATIONS

### Party Configuration
**File**: `/var/www/voteraction/src/lib/constants.ts`

```typescript
const BASE_PARTY_CONFIG = {
    'भाजपा (BJP)': { color: '#FF9933', logo: '/logos/bjp.png', nameEn: 'BJP' },
    'सपा (SP)': { color: '#FF0000', logo: '/logos/sp.png', nameEn: 'SP' },
    'बसपा (BSP)': { color: '#0000FF', logo: '/logos/bsp.avif', nameEn: 'BSP' },
    'कांग्रेस (INC)': { color: '#00FF00', logo: '/logos/inc.png', nameEn: 'INC' },
    'रालोद (RLD)': { color: '#006400', logo: '/logos/rld.png', nameEn: 'RLD' },
    'आप (AAP)': { color: '#00ADEF', logo: '/logos/aap.png', nameEn: 'AAP' },
    'सुभासपा (SBSP)': { color: '#FFFF00', logo: '/logos/sbsp.png', nameEn: 'SBSP' },
    'निर्दलीय (IND)': { color: '#666666', logo: '/logos/ind.png', nameEn: 'IND' },
    'अन्य (Others)': { color: '#94A3B8', logo: '/logos/other.png', nameEn: 'Others' }
};
```

**Logo Assets**: `/var/www/voteraction/public/logos/` (LOCKED)

### Role-Based Access
**File**: `/var/www/voteraction/src/components/Sidebar.tsx`

- MANAGER role menu items (Lines 79-90) - **LOCKED**
- Role-based routing and permissions - **LOCKED**

---

## 🚫 RESTRICTED OPERATIONS

The following operations are **NOT ALLOWED** without explicit approval:

1. ❌ Changing the order of menu items in the MANAGER sidebar
2. ❌ Adding or removing menu items from MANAGER navigation
3. ❌ Modifying the dashboard layout or statistics display
4. ❌ Changing party configurations or logo mappings
5. ❌ Altering historical election data display logic
6. ❌ Removing or modifying any features from locked pages
7. ❌ Changing the visual design or UI components of candidate pages
8. ❌ Modifying role-based access control for MANAGER role

---

## ✅ ALLOWED OPERATIONS

The following operations are permitted:

1. ✅ Bug fixes that do not alter functionality
2. ✅ Performance optimizations that maintain exact same behavior
3. ✅ Backend data updates (e.g., adding new historical election data)
4. ✅ Security patches and critical updates
5. ✅ Database schema migrations (with data preservation)

---

## 📝 VERIFICATION CHECKLIST

Before any deployment, verify:

- [ ] MANAGER menu order matches the locked structure above
- [ ] All 9 menu items are present and functional
- [ ] Dashboard displays all sections correctly
- [ ] Historical election data shows party logos
- [ ] No unauthorized UI changes in candidate pages
- [ ] Role permissions remain unchanged for MANAGER

---

## 🔄 MODIFICATION REQUEST PROCESS

If modifications to candidate pages are required:

1. Document the specific change needed
2. Obtain explicit approval from project owner
3. Update this document with approved changes
4. Implement the change
5. Verify against the updated checklist

---

## 📊 TECHNICAL SPECIFICATIONS

### Database Schema (LOCKED)
- Assembly model with historical election data
- ElectionHistory model with party-wise results
- User model with MANAGER role support
- Worker model with booth/panna assignments

### API Endpoints (LOCKED)
- `/api/dashboard/stats` - Dashboard statistics
- `/api/voters/*` - Voter management
- `/api/booths/*` - Booth operations
- `/api/workers/*` - Worker management
- All candidate-related server actions in `/var/www/voteraction/src/app/actions/`

---

## 🎯 LOCK CONFIRMATION

**Locked By**: Development Team  
**Approved By**: Project Owner  
**Lock Date**: 2026-02-01 17:00 IST  
**Status**: 🔒 **FULLY LOCKED**

---

**END OF DOCUMENT**
