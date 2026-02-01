# VoterAction - Critical Issues Fix Plan

## Priority 1: Critical UX Issues ⚠️

### 1. Assembly Selection - Admin Only
**Issue**: Candidate भी assembly select कर सकता है
**Fix**: Settings page में role-based access control
**Files**: `src/app/(app)/settings/page.tsx`

### 2. User Role Change - Page Stuck
**Issue**: Role change करने पर page refresh/redirect नहीं हो रहा
**Fix**: Role change पर proper navigation + session update
**Files**: `src/app/actions/admin.ts`, `src/app/(app)/settings/page.tsx`

### 3. Theme Color Not Changing
**Issue**: Theme selector काम नहीं कर रहा
**Fix**: CSS variable update + localStorage persistence
**Files**: `src/app/(app)/settings/page.tsx`, global CSS

## Priority 2: Candidate Profile

### 4. Candidate Photo Crop/Frame
**Issue**: Photo upload है पर crop/adjust नहीं कर सकते
**Fix**: Image cropper component add करना
**Implementation**:
- Use `react-easy-crop` library
- Circular frame preview
- Zoom/pan controls
**Files**: New component `CandidatePhotoEditor.tsx`

## Priority 3: Social Media Section 🎯

### 5. Enhanced Post Creation Form
**Current**: Basic text + platform selection
**Required Fields**:
- ✅ कार्यक्रम (Event name)
- ✅ स्थान (Location)
- ✅ महत्वपूर्ण लोग (Important people - tags)
- ✅ फोटोज (Multiple photo upload)
- ✅ रील के लिए वीडियो (Video upload for reels)

**Schema Update Required**: Add to SocialPost model
**Files**: 
- `prisma/schema.prisma`
- `src/app/(app)/social/page.tsx`
- `src/app/actions/social.ts`

## Priority 4: Issues Section 🏗️

### 6. Issue Edit Functionality
**Issue**: कोई edit option नहीं है
**Fix**: Edit button + modal/form
**Files**: `src/app/(app)/issues/page.tsx`, `src/app/actions/issues.ts`

### 7. Enhanced Issue Creation
**Required Fields**:
- ✅ गांव/एरिया selector (from voter data)
- ✅ फोटो upload (multiple)
- ✅ वीडियो upload
- ✅ Priority/Category

**Schema Update Required**: Add media fields to Issue model
**Files**:
- `prisma/schema.prisma`
- `src/app/(app)/issues/page.tsx`

### 8. Area-based Issue Filtering
**Issue**: सभी issues एक साथ दिख रहे हैं
**Fix**: Area/Village dropdown filter
**Files**: `src/app/(app)/issues/page.tsx`, `src/app/actions/issues.ts`

## Implementation Order:

### Phase 1 (Immediate - 30 mins):
1. ✅ Assembly selection - Admin only
2. ✅ Theme color fix
3. ✅ Role change redirect fix

### Phase 2 (1 hour):
4. ✅ Issue edit functionality
5. ✅ Issue area filter
6. ✅ Issue village field

### Phase 3 (1-2 hours):
7. ✅ Social media enhanced form (all new fields)
8. ✅ Photo/video upload for social posts
9. ✅ Photo/video upload for issues

### Phase 4 (Optional - Polish):
10. ✅ Candidate photo cropper
11. ✅ UI/UX improvements
12. ✅ Mobile responsiveness

## Database Schema Changes Required:

### SocialPost Model:
```prisma
model SocialPost {
  // Existing fields...
  eventName       String?
  location        String?
  importantPeople String[]  // Array of names
  photos          String[]  // Array of image URLs
  videoUrl        String?   // For reels
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### Issue Model:
```prisma
model Issue {
  // Existing fields...
  village         String?
  area            String?
  photos          String[]  // Array of image URLs
  videoUrl        String?
  priority        String?   @default("Medium")
  updatedAt       DateTime  @updatedAt
}
```

## File Upload Strategy:

**Options**:
1. **Local Storage** (Quick): Save to `/public/uploads/`
2. **Cloud Storage** (Better): Use Cloudinary/AWS S3

**Recommendation**: Start with local storage for testing, migrate to cloud later.

---

## Starting with Phase 1 NOW! 🚀
