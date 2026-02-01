# VoterAction Application - Bug Fix Implementation Plan

## Priority 1: Critical Fixes (Immediate)

### 1. ✅ Jan Sampark Save Issue - FIXED
- **Status**: Completed
- **Changes**: Added error handling and loading state to form submission
- **File**: `/var/www/voteraction/src/app/(app)/jansampark/page.tsx`

### 2.  Party Logo Display in Settings
- **Issue**: Party logos from Wikipedia may not be loading properly
- **Solution**:
  - Verify logo URLs are working
  - Add fallback images if needed
  - Consider hosting logos locally
- **Files**: `/var/www/voteraction/src/constants/parties.ts`

### 3. Admin Party Management
- **Issue**: No ability for admin to add/edit parties
- **Solution**:
  - Create admin party management page
  - Add party CRUD operations
  - Store parties in database instead of constants
- **Files to create**:
  - `/var/www/voteraction/prisma/schema.prisma` (add Party model)
  - `/var/www/voteraction/src/app/actions/party.ts`
  - `/var/www/voteraction/src/app/(app)/admin/parties/page.tsx`

## Priority 2: Feature Completion (Important)

### 4. Social Media Section
- **Current State**: Static/mock UI only
- **Required**:
  - Add SocialPost model to schema
  - Create actions for post CRUD
  - Make form functional with save/edit/delete
- **Files**:
  - Add to `/var/www/voteraction/prisma/schema.prisma`
  - Create `/var/www/voteraction/src/app/actions/social.ts`
  - Update `/var/www/voteraction/src/app/(app)/social/page.tsx`

### 5. Issues (Complaints) Section
- **Current State**: Static mock data
- **Required**:
  - Add Issue model to schema
  - Create actions for issue management
  - Add drag-drop status updates (kanban style)
- **Files**:
  - Add to `/var/www/voteraction/prisma/schema.prisma`
  - Create `/var/www/voteraction/src/app/actions/issues.ts`
  - Update `/var/www/voteraction/src/app/(app)/issues/page.tsx`

### 6. Workers & Team Section
- **Current State**: Has getWorkersInAssembly but may need fixes
- **Required**:
  - Verify worker data is loading from database
  - Add worker add/edit/delete functionality
  - Connect with users table properly
- **Files**:
  - Check `/var/www/voteraction/src/app/actions/worker.ts`
  - Update `/var/www/voteraction/src/app/(app)/workers/page.tsx`

### 7. Booth Management
- **Current State**: Static mock data
- **Required**:
  - Add Booth model to schema (if not exists)
  - Create booth CRUD actions
  - Link booths with workers (booth incharge)
  - Calculate coverage from voter data
- **Files**:
  - Check/Update `/var/www/voteraction/prisma/schema.prisma`
  - Create `/var/www/voteraction/src/app/actions/booth.ts`
  - Update `/var/www/voteraction/src/app/(app)/booths/page.tsx`

## Priority 3: Data Integration

### 8. ✅ Voter List Village Display
- **Status**: Already working
- **Note**: Village name is already showing in voter list table

### 9. Dashboard Previous Election Data
- **Current State**: Displayed but may not be connected to voter analysis
- **Required**:
  - Connect previous vote data with current voter sentiment analysis
  - Add comparison metrics (2022 vs projected 2026)
- **Files**: `/var/www/voteraction/src/app/(app)/dashboard/page.tsx`

## Implementation Order

1. ✅ Fix Jan Sampark save (DONE)
2. Fix party logo loading
3. Add database models (Party, SocialPost, Issue, Booth)
4. Create server actions for each module
5. Update UI pages to use real data
6. Add admin party management
7. Integrate voter sentiment with previous data

## Database Schema Updates Needed

```prisma
model Party {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  shortName String?
  color     String
  logoUrl   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model SocialPost {
  id          Int      @id @default(autoincrement())
  content     String
  imageUrl    String?
  status      String   // Draft, Approved, Published
  platform    String?  // Facebook, Instagram, Twitter
  assemblyId  Int
  assembly    Assembly @relation(fields: [assemblyId], references: [id])
  createdBy   Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Issue {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  category    String?
  priority    String   // High, Medium, Low
  status      String   // Open, In Progress, Closed
  boothNumber Int?
  assemblyId  Int
  assembly    Assembly @relation(fields: [assemblyId], references: [id])
  createdBy   Int?
  resolvedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Booth {
  id          Int      @id @default(autoincrement())
  number      Int
  name        String?
  location    String?
  totalVoters Int?
  assemblyId  Int
  assembly    Assembly @relation(fields: [assemblyId], references: [id])
  inchargeId  Int?
  incharge    Worker?  @relation(fields: [inchargeId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([number, assemblyId])
}
```

## Testing Checklist

- [ ] Jan Sampark form saves correctly
- [ ] Party logos display in settings
- [ ] Admin can add new parties
- [ ] Social media posts can be created
- [ ] Issues can be tracked through workflow
- [ ] Workers list loads from database
- [ ] Booths show real voter counts
- [ ] Dashboard shows connected previous vs current data

## Notes

- All static data needs to be migrated to database
- Consider adding image upload for party logos
- Add proper error handling for all forms
- Test with actual production data volume
