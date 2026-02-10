# VoterAction - Complete Project Documentation

**Last Updated:** February 4, 2026  
**Version:** Production 2.3  
**Tech Stack:** Next.js 16.1.6, Prisma, PostgreSQL, NextAuth

---

## 🏗️ PROJECT ARCHITECTURE

### Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Backend:** Next.js API Routes, Server Actions
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth v5
- **Deployment:** PM2, Nginx (Proxy to port 3001)
- **Cloud Storage:** Google Drive API (7-day auto-delete for media files)

### Key Directories
```
/src
  /app
    /(app)              # Main authenticated app routes
      /admin            # Admin dashboard
      /candidate        # Candidate dashboard
      /social-sena      # Social media management (Central + Candidate-specific)
        /designer       # Designer workspace
        /video-editor   # Video editor workspace
      /voter            # Voter management
    /api                # API routes
    /actions            # Server actions
  /components           # Reusable components
  /context             # React contexts (ViewContext, LayoutContext)
  /lib                 # Utilities (prisma, cloudStorage, etc.)

/prisma
  schema.prisma        # Database schema
```

---

## 👥 USER ROLES & ACCESS

### 1. **SUPERADMIN / ADMIN**
- Full system access
- Can simulate any role via ViewContext
- Manages assemblies, users, and system settings

### 2. **MANAGER** (Candidate)
- Manages their assembly constituency
- Social media accounts (Facebook/Instagram/Twitter)
- Reviews central content from Social Sena team
- Assigns work to local social media workers

### 3. **SOCIAL_MEDIA Workers**
Types:
- **CENTRAL_MANAGER:** Assigns tasks to designers/editors, reviews submissions
- **CENTRAL_DESIGNER:** Creates visual content (posters, graphics)
- **CENTRAL_EDITOR:** Creates video content
- **CENTRAL_MONITOR:** Monitors social media (future)
- **SOCIAL_CENTRAL:** General central team access

Local workers (assigned to specific candidates):
- Upload photos/videos for candidate approval
- Manage candidate's social media posts

### 4. **WORKER Types**
- **PANNA_PRAMUKH:** Booth-level worker (manages ~40-50 voters)
- **DESIGNER/EDITOR:** Content creation roles

---

## 📱 MAJOR FEATURES & PAGES

### Social Sena (Central Workflow)
**Path:** `/social-sena`

#### Candidate List View
- Shows all candidates with their social media stats
- Search by name, state, party
- Grid/List view toggle
- "डिजाइनर / वीडियो एडिटर वर्कस्पेस" button for central team

#### Central Workflow Dashboard
**Access:** Central Managers, Designers, Editors
**Path:** Triggered via "ओपेन करें" button

**Features:**
- **Dashboard Stats:**
  - कुल टास्क (Total Tasks)
  - रिव्यू के लिए पेंडिंग (Pending for Review) - Manager view
  - मेरे पेंडिंग टास्क (My Pending Tasks) - Designer/Editor view
  - सुधार के लिए भेजा (Correction Requested)
  - कम्पलीट / अप्रूव्ड (Completed/Approved)

- **Manager Actions:**
  - Create new tasks (assign to designers/editors)
  - Review submitted work (Approve/Correction/Reject)
  - Send approved content to candidates

- **Designer/Editor Actions:**
  - View assigned tasks
  - Upload completed work (via cloud storage)
  - Resubmit after corrections

**Task Statuses:**
- `ASSIGNED` - New task assigned
- `SUBMITTED` - Designer submitted work
- `CORRECTION_REQUESTED` - Manager requested changes
- `REJECTED_BY_MANAGER` - Rejected
- `APPROVED_BY_MANAGER` - Manager approved
- `SENT_TO_CANDIDATE` - Sent to candidate
- `APPROVED_BY_CANDIDATE` - Final approval

#### Candidate-Specific Social Sena
**Features:**
- Social media account linking (Facebook/Instagram/Twitter)
- Session-based account locking (prevents multiple simultaneous logins)
- Upload photos/videos for manager approval
- View pending approvals and request status
- Campaign materials section
- Routes/Jansamparak planner

### Admin Dashboard
**Path:** `/admin`

**Key Sections:**
- User management (create, edit, delete)
- Assembly management
- Party configuration
- Fee distribution settings (delivery charges, platform share)
- Analytics dashboard
- Content management (via Directus integration - planned)

### Candidate Dashboard
**Path:** `/candidate`

**Features:**
- KPI overview (voters, workers, booths)
- Social media performance
- Worker management
- Voter management
- Content calendar
- Poll day operations

### Voter Management
**Features:**
- Family-based voter organization
- Booth assignment
- Voter categorization (Pakka/Kachha/Virodhi)
- ECI voter list sync
- Bulk import via CSV

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### NextAuth Configuration
- Credentials provider (username/password)
- Session strategy: JWT
- Custom callbacks for role/assembly injection

### View Simulation (ViewContext)
**Purpose:** Admins can simulate different roles without switching accounts

**Implementation:**
- Cookies: `effectiveRole`, `effectiveWorkerType`
- Floating switcher component
- Automatically shows/hides based on user's actual role

### Role-Based Redirects
- Directors (CENTRAL_DESIGNER/EDITOR) → `/social-sena/designer` or `/video-editor`
- Managers → Auto-select their candidate in Social Sena
- Admins → Full access everywhere

---

## 🗄️ DATABASE SCHEMA (Key Models)

### User
```prisma
- id, name, username, password (hashed)
- role: ADMIN, SUPERADMIN, MANAGER, SOCIAL_MEDIA, WORKER
- assemblyId (for managers)
- worker: Worker? (relation for worker-specific data)
```

### Worker
```prisma
- type: PANNA_PRAMUKH, CENTRAL_DESIGNER, CENTRAL_EDITOR, etc.
- sharedAssignments: Share[] (for multi-assembly access)
```

### Assembly
```prisma
- Represents a constituency
- candidateName, party, themeColor
- socialMediaUrls (facebook, instagram, twitter)
```

### CentralContentTask
```prisma
- title, instructions, inputMediaUrls
- status: ASSIGNED → SUBMITTED → APPROVED/REJECTED → SENT_TO_CANDIDATE
- designerId, managerId
- outputMediaUrls, feedback
- createdAt, updatedAt
```

### CloudFile
```prisma
- fileName, externalId (Google Drive file ID)
- expiresAt (7 days from upload)
- uploadedBy
```

---

## 🎨 UI/UX DESIGN PRINCIPLES

### Color Scheme
- Primary: `#2563EB` (Blue)
- Success: `#10B981` (Green)
- Warning: `#F59E0B` (Amber)
- Danger: `#EF4444` (Red)
- Background: `#F4F7FE` (Light gray-blue)

### Layout
- **Sidebar:** 260px width (hidden on Social Sena pages via CSS override)
- **Main Container:** Full width on workflow pages, max 1600px on candidate pages
- **Cards:** 24px border-radius, subtle shadows
- **Spacing:** Consistent 16px/24px/32px gaps

### Responsive Design
- Grid layouts with `minmax(280px, 1fr)` for stats
- Auto-fill grids for candidate/task cards
- Mobile optimizations (sidebar collapse)

---

## ⚡ PERFORMANCE OPTIMIZATIONS

### Build Configuration
- Turbopack enabled
- Memory allocation: `--max-old-space-size=2048`
- TypeScript compilation: ~3 minutes (due to large codebase)

### API Optimizations
- Server actions for data fetching (avoid client-side API calls)
- Prisma query optimization (use `include` carefully)
- Pagination on large datasets

### Caching Strategy
- Static pages cached by Nginx
- Client-side state management via React hooks
- No redundant re-renders (useEffect dependency arrays optimized)

---

## 🔧 COMMON ISSUES & FIXES

### 1. Build Out of Memory (SIGKILL)
**Solution:**
```bash
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

### 2. Sidebar Space on Social Sena Pages
**Fix:** CSS overrides in component
```tsx
<style dangerouslySetInnerHTML={{
  __html: `
    .sidebar { display: none !important; }
    .main-container { margin-left: 0 !important; width: 100% !important; }
  `
}} />
```

### 3. Middleware Deprecation Warning
**Note:** Next.js warning about moving to "proxy" pattern. No action needed yet (still works).

### 4. Async Params in Route Handlers
**Fix:** Use `Promise<{}>` for params in Next.js 16
```ts
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
}
```

---

## 🚀 DEPLOYMENT

### Production Server
- **URL:** https://voteraction.creatiav.com
- **Port:** 3001 (proxied via Nginx)
- **Process Manager:** PM2

### Deployment Commands
```bash
# Navigate to project
cd /var/www/voteraction

# Build with memory allocation
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Restart PM2
pm2 restart voteraction

# Check logs
pm2 logs voteraction
```

### Environment Variables (.env)
- `DATABASE_URL`: PostgreSQL connection
- `NEXTAUTH_SECRET`: JWT secret
- `NEXTAUTH_URL`: App URL
- Google Drive API credentials (for cloud storage)

---

## 📊 METRICS & ANALYTICS (Planned)

- User engagement tracking
- Task completion rates
- Social media performance metrics
- Voter reach/coverage statistics

---

## 🛣️ FUTURE ENHANCEMENTS

1. **Real-time Notifications:** WebSockets for live task updates
2. **Mobile App:** React Native/Capacitor build
3. **AI Content Suggestions:** Auto-generate social media captions
4. **Advanced Analytics:** Dashboards with charts/graphs
5. **Multi-language Support:** Full Hindi/English localization
6. **Offline Mode:** Service workers for field workers

---

## 📝 IMPORTANT NOTES

### File Upload Strategy
- **Cloud Storage:** 7-day auto-delete (Google Drive)
- Warning prominently displayed: "बैकअप रखें"
- Upload size limits enforced

### Security Considerations
- Passwords hashed with bcryptjs
- Session-based access control
- No sensitive data in client-side state
- API routes protected with role checks

### Testing Strategy
- Manual testing via admin simulation
- Test scripts created for workflow verification (now deleted)
- Database queries tested via Prisma Studio

---

## 📞 SUPPORT & MAINTENANCE

### Key Files to Monitor
- `/src/app/(app)/social-sena/CentralWorkflowView.tsx` - Main workflow
- `/src/app/actions/centralContent.ts` - Server actions
- `/prisma/schema.prisma` - Database schema
- `.env` - Environment configuration

### Regular Maintenance
- Clear old cloud files (auto-deleted after 7 days)
- Database backups (weekly recommended)
- Monitor PM2 logs for errors
- Update dependencies quarterly

---

**End of Documentation**
