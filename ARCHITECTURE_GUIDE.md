# VerifiED Architecture Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Quick Reference](#quick-reference)
4. [Adding New Features](#adding-new-features)
5. [Testing](#testing)
6. [Collaboration Rules](#collaboration-rules)

---

## Overview

Successfully refactored from monolithic "god objects" to a clean, page-based architecture:
- **Before:** 1098-line server.js + 329-line apiService.js (merge conflicts everywhere!)
- **After:** 5 route files + 5 service files organized by page (zero conflicts!)

### Benefits
✅ **Zero merge conflicts** - Different pages = different files  
✅ **Clear ownership** - You work on institution files, co-worker works on student files  
✅ **Less overwhelming** - 5 files instead of 8+  
✅ **Page-aligned** - Matches your app's actual structure  

---

## File Structure

### Backend Routes (`src/routes/`)
```
publicRoutes.js       → HomePage (Contact & Verification)
studentRoutes.js      → Student Dashboard (MyVerifiED)
institutionRoutes.js  → Institution Dashboard
authRoutes.js         → Login (shared)
adminRoutes.js        → Admin Dashboard
```

### Frontend Services (`src/services/`)
```
publicApiService.js       → HomePage APIs
studentApiService.js      → Student Dashboard APIs
institutionApiService.js  → Institution Dashboard APIs
authApiService.js         → Login API
adminApiService.js        → Admin Dashboard APIs
blockchainService.js      → MetaMask & blockchain (core)
pinataService.js          → IPFS uploads (core)
```

### Frontend Components (`src/components/`)
```
common/              → Shared components (Navigation, Login, ErrorModal)
home/                → HomePage components (HomePage, VerifierSection)
student/             → Student Dashboard (MyVerifiED, sections)
institution/         → Institution Dashboard (AcademicInstitution, modals)
admin/               → Admin Dashboard (AdminDashboard, management)
```

---

## Quick Reference

### Working on HomePage?
**Files:** `src/routes/publicRoutes.js` + `src/services/publicApiService.js`

```javascript
// Frontend import
import { submitContactForm, verifyCredential } from '../services/publicApiService';

// API Endpoints
POST   /api/public/contact
POST   /api/public/verify-credential
```

### Working on Student Dashboard?
**Files:** `src/routes/studentRoutes.js` + `src/services/studentApiService.js`

```javascript
// Frontend import
import {
  fetchStudentName,
  fetchStudentCredentials,
  generateCredentialAccessCode,
  linkAccount,
  unlinkAccount
} from '../services/studentApiService';

// API Endpoints
GET    /api/student/:studentId/name
GET    /api/student/:studentId/credentials
POST   /api/student/generate-access-code
POST   /api/student/link-account
DELETE /api/student/unlink-account
// ... more endpoints
```

### Working on Institution Dashboard?
**Files:** `src/routes/institutionRoutes.js` + `src/services/institutionApiService.js`

```javascript
// Frontend import
import {
  fetchInstitutionName,
  addStudent,
  bulkImportStudents,
  uploadCredential,
  fetchIssuedCredentials
} from '../services/institutionApiService';

// API Endpoints
GET    /api/institution/:accountId/name
POST   /api/institution/students/add/:institutionId
POST   /api/institution/students/bulk-import/:institutionId
POST   /api/institution/upload-credential
GET    /api/institution/issued-credentials/:institutionId
// ... more endpoints
```

### Working on Login?
**Files:** `src/routes/authRoutes.js` + `src/services/authApiService.js`

```javascript
// Frontend import
import { login } from '../services/authApiService';

// API Endpoint
POST   /api/auth/login
```

### Working on Admin Dashboard?
**Files:** `src/routes/adminRoutes.js` + `src/services/adminApiService.js`

```javascript
// Frontend import
import {
  fetchSystemStats,
  fetchAllInstitutions,
  createInstitution
} from '../services/adminApiService';

// API Endpoints
GET    /api/admin/stats
GET    /api/admin/institutions
POST   /api/admin/institutions
// ... more endpoints
```

---

## Adding New Features

### Example: Add a new Student Dashboard feature

**Step 1: Backend** - Add route in `src/routes/studentRoutes.js`
```javascript
// GET /api/student/new-feature
router.get('/new-feature', (req, res) => {
  // Your logic here
  res.json({ data: 'your data' });
});
```

**Step 2: Frontend** - Add API function in `src/services/studentApiService.js`
```javascript
export const fetchNewFeature = async () => {
  try {
    const response = await axios.get(`${API_URL}/student/new-feature`);
    return response.data;
  } catch (error) {
    console.error('Error fetching new feature:', error);
    throw error;
  }
};
```

**Step 3: Component** - Use in your component
```javascript
import { fetchNewFeature } from '../services/studentApiService';

// Inside your component
const data = await fetchNewFeature();
```

---

## Testing

### Quick Test
```bash
# Start backend
node server.js

# Expected output:
Server running on port 3001
📁 Routes organized by page:
  - /api/public      → HomePage (Contact & Verification)
  - /api/student     → Student Dashboard (MyVerifiED)
  - /api/institution → Institution Dashboard
  - /api/auth        → Login (shared)
  - /api/admin       → Admin Dashboard

# Start frontend (in new terminal)
npm start
```

### Test Checklist

#### Public Pages
- [ ] Contact form submission works
- [ ] Credential verification works

#### Student Dashboard
- [ ] Login as student works
- [ ] View credentials works
- [ ] Generate access codes works
- [ ] Account linking works

#### Institution Dashboard
- [ ] Login as institution works
- [ ] Add student works
- [ ] Bulk import students works
- [ ] Issue credential works (IPFS + blockchain)
- [ ] View issued credentials works

#### Admin Dashboard
- [ ] Login as admin works
- [ ] View system stats works
- [ ] Manage institutions works

### Browser Console Check
Open DevTools (F12):
- ✅ No "Cannot find module" errors
- ✅ No 404 errors in Network tab
- ✅ All API requests return 200 OK

---

## Collaboration Rules

### Rule 1: Work on Different Pages = Zero Conflicts!
```
You              → institutionRoutes.js + institutionApiService.js
Co-programmer    → studentRoutes.js + studentApiService.js
Result           → No merge conflicts! 🎉
```

### Rule 2: Communicate About Shared Files
Before editing these files, coordinate with your team:
- `server.js` (main server)
- `authRoutes.js` (login)
- `publicRoutes.js` (homepage)

### Rule 3: Follow the Pattern
❌ **DON'T** create new route files  
❌ **DON'T** mix concerns (student features in institution routes)  
✅ **DO** add related features to existing page-based files  
✅ **DO** test before committing  

---

## Common Issues

### "Cannot find module '../services/apiService'"
**Solution:** Old import. Update to use the correct service:
- `publicApiService` for HomePage
- `studentApiService` for Student Dashboard
- `institutionApiService` for Institution Dashboard
- `authApiService` for Login
- `adminApiService` for Admin Dashboard

### 404 on API endpoints
**Solution:** Check if endpoint path matches new structure:
- Old: `/api/students/...` ❌
- New: `/api/student/...` ✅

### Server won't start
**Solution:**
1. Check all route files exist in `src/routes/`
2. Verify imports in `server.js`
3. Check for syntax errors

---

## Rollback (Emergency Only)

If critical issues arise:
```bash
# Stop server
# Restore old server
mv server.js server_refactored.js
mv server_old_backup.js server.js

# Restore old apiService from git
git checkout HEAD -- src/services/apiService.js

# Restart
node server.js
```

---

## Summary

**Architecture:** Page-based (5 backend routes + 5 frontend services)  
**Collaboration:** Zero merge conflicts when working on different pages  
**Maintenance:** Easy to find and modify features  
**Testing:** Clear separation makes testing straightforward  

**Status:** ✅ Migration Complete | ❌ Old God Objects Deleted | 🎉 Team Collaboration Enabled
