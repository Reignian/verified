# Institution Sign-Up System Implementation

## Overview
Implemented a comprehensive sign-up system for institution accounts with admin approval workflow. Users can create their own institution accounts, which are then sent to the admin for approval before they can log in.

## Features Implemented

### 1. Database Changes
- **Added `status` column to `account` table**
  - Enum values: `pending`, `approved`, `rejected`
  - Default value: `approved` (for backward compatibility)
  - Location: `verified_db.sql` line 36

### 2. Sign-Up Component (`SignUp.js`)
A multi-step sign-up process with comprehensive instructions:

#### Step 1: Instructions
- Overview of the sign-up process
- Requirements explanation
- Admin approval workflow information

#### Step 2: MetaMask Setup Guide
- Detailed step-by-step instructions for installing MetaMask
- Wallet creation guidance
- Security tips for recovery phrase
- Public address explanation
- Note: Public address is added AFTER account approval during login

#### Step 3: Account Creation Form
- Institution name
- Username (minimum 3 characters)
- Email address
- Password (minimum 8 characters)
- Password confirmation
- Submit button sends request to admin

#### Success Screen
- Confirmation message
- Next steps information
- Back to login button

### 3. Backend Implementation

#### Authentication Routes (`authRoutes.js`)
- **POST `/api/auth/signup`**
  - Creates institution account with `status = 'pending'`
  - Hashes password with bcrypt
  - Creates both `account` and `institution` table entries
  - Returns success message

- **POST `/api/auth/login`** (Updated)
  - Checks account status before allowing login
  - Rejects login if status is `pending` or `rejected`
  - Shows appropriate error messages

#### Admin Routes (`adminRoutes.js`)
- **GET `/api/admin/institutions/pending`**
  - Retrieves all pending institution requests

- **PUT `/api/admin/institutions/:id/approve`**
  - Approves institution account
  - Sets status to `approved`

- **PUT `/api/admin/institutions/:id/reject`**
  - Rejects institution account
  - Sets status to `rejected`

#### Admin Queries (`adminQueries.js`)
- **`getAllInstitutions()`** - Updated to include status column and sort pending first
- **`getPendingInstitutions()`** - New function to get pending requests
- **`approveInstitution()`** - New function to approve accounts
- **`rejectInstitution()`** - New function to reject accounts
- **`createInstitution()`** - Updated to set status as `approved` immediately (admin-created accounts)

### 4. Admin Dashboard Updates

#### InstitutionManagement Component
- **Status Badge Display**
  - Pending: Yellow badge with clock icon
  - Approved: Green badge with check icon
  - Rejected: Red badge with X icon

- **Action Buttons**
  - For pending accounts: Approve/Reject buttons
  - For approved accounts: Edit/Delete buttons
  - Rejected accounts: Delete only (edit disabled)

- **Table Columns**
  - Added Status column
  - Shows institution name, username, email, status, students, credentials, created date

### 5. Login Page Updates
- Added "Sign Up as Institution" button
- Divider with "Don't have an account?" text
- Information text about admin approval
- Button navigates to `/signup` route
- Only visible for non-admin login

### 6. Routing Updates (`App.js`)
- Added SignUp component import
- Added `/signup` and `/verified/signup` routes
- Updated navigation hiding logic to include signup page

### 7. API Service Updates (`adminApiService.js`)
- Added `approveInstitution()` function
- Added `rejectInstitution()` function

## User Flow

### For Institution Users:
1. Visit login page
2. Click "Sign Up as Institution" button
3. Read instructions (Step 1)
4. Follow MetaMask setup guide (Step 2)
5. Fill in account details (Step 3)
6. Submit request
7. Wait for admin approval email
8. Login after approval
9. Add MetaMask public address during first login

### For Admin Users:
1. Login to admin dashboard
2. Navigate to "Institutions" tab
3. See pending requests at the top (yellow badge)
4. Review institution details
5. Click Approve or Reject button
6. Institution receives notification (future enhancement)
7. Approved institutions can now login

## Security Features
- Password hashing with bcrypt (10 salt rounds)
- Status validation on login
- Admin-only approval/rejection
- Separate pending status prevents unauthorized access
- MetaMask public address added only after approval

## Database Schema Changes

```sql
ALTER TABLE `account` 
ADD COLUMN `status` enum('pending','approved','rejected') 
COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'approved' 
AFTER `email`;
```

## Files Modified

### Frontend:
1. `src/components/common/SignUp.js` (NEW)
2. `src/components/common/SignUp.css` (NEW)
3. `src/components/common/Login.js` (Updated)
4. `src/components/common/Login.css` (Updated)
5. `src/components/admin/InstitutionManagement.js` (Updated)
6. `src/services/adminApiService.js` (Updated)
7. `src/App.js` (Updated)

### Backend:
1. `src/routes/authRoutes.js` (Updated)
2. `src/routes/adminRoutes.js` (Updated)
3. `src/queries/adminQueries.js` (Updated)

### Database:
1. `verified_db.sql` (Updated)

## Testing Checklist

### Sign-Up Flow:
- [ ] Navigate to login page
- [ ] Click "Sign Up as Institution" button
- [ ] Verify all 3 steps display correctly
- [ ] Submit sign-up form with valid data
- [ ] Verify success message appears
- [ ] Check database for pending account

### Login Validation:
- [ ] Try logging in with pending account (should fail)
- [ ] Try logging in with rejected account (should fail)
- [ ] Try logging in with approved account (should succeed)
- [ ] Verify error messages are appropriate

### Admin Approval:
- [ ] Login as admin
- [ ] Navigate to Institutions tab
- [ ] Verify pending accounts show at top with yellow badge
- [ ] Click Approve button
- [ ] Verify status changes to approved (green badge)
- [ ] Verify approved account can now login

### Admin Rejection:
- [ ] Login as admin
- [ ] Find pending account
- [ ] Click Reject button
- [ ] Verify status changes to rejected (red badge)
- [ ] Verify rejected account cannot login
- [ ] Verify edit button is disabled for rejected accounts

### Admin Creation:
- [ ] Login as admin
- [ ] Click "Add Institution" button
- [ ] Fill in form and submit
- [ ] Verify new institution has "approved" status immediately
- [ ] Verify new institution can login immediately

## Future Enhancements
1. Email notifications on approval/rejection
2. Rejection reason field
3. Re-submission for rejected accounts
4. Admin notes/comments on accounts
5. Bulk approval/rejection
6. Account verification via email before admin review
7. Institution document upload (proof of legitimacy)
8. Automated approval based on criteria

## Notes
- All existing accounts default to "approved" status
- Admin-created accounts are automatically approved
- User-created accounts start as "pending"
- MetaMask public address is added AFTER approval during login
- Password reset functionality should be added in future updates
