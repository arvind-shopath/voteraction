# Social Media Section - Clean Architecture

## URL Structure

- `/social` → **Redirector** (routes based on user role)
- `/social/content` → **Social Media Team Dashboard**
- `/social/worker` → **Ground Workers (Share Posts)**  
- `/social/candidate` → **Candidate Interface** (TO BE CREATED)

## Current Status

✅ `/social/page.tsx` - Redirector working
✅ `/social/content/page.tsx` - Team dashboard working  
✅ `/social/worker/page.tsx` - Worker interface created
⏳ `/social/candidate/page.tsx` - NEEDS TO BE CREATED

## Candidate Page Requirements

The candidate page should include:

1. **Team Approvals Section** - View and approve/reject content from social media team
2. **Social Media Links** - Configure Facebook, Twitter, Instagram URLs
3. **Post Request Form** - Submit raw content requests to social media team
   - Location
   - Subject
   - Description
   - Important people tags
   - Photo/video uploads
4. **Status Tracker** - View status of submitted requests by date
5. **Preview Panel** - Social media feed preview (sticky sidebar)

## Next Step

Create `/social/candidate/page.tsx` with all the features listed above.
The file will be large (~400-500 lines) so needs to be created carefully.
