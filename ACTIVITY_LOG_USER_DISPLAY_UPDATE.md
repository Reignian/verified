# Activity Log - User Display Enhancement

## Overview
Updated the activity log system to properly identify and display who performed each action, distinguishing between main institution admins and staff members.

## What Changed

### Display Logic
The system now shows:
- **Main Admin**: Displays the username from the `account` table with role badge "(Main Admin)"
- **Staff**: Displays the full name (first + middle + last name) from the `institution_staff` table with role badge "(Staff)"

### Example Display
```
John Smith (Main Admin) Profile Updated
Jane Doe (Staff) Staff Added
```

## Technical Implementation

### 1. Database Query Enhancement
**File**: `src/queries/academicInstitutionQueries.js`

The `getActivityLogs` query now:
- Joins with the `account` table to get username and account type
- Left joins with `institution_staff` table to get staff member names
- Uses a CASE statement to determine the display name:
  - For `institution` account type: Shows username
  - For `institution_staff` account type: Shows full name (first + middle + last)
- Adds a `user_role` field that shows "Main Admin" or "Staff"

```sql
CASE 
  WHEN a.account_type = 'institution' THEN a.username
  WHEN a.account_type = 'institution_staff' THEN CONCAT(ist.first_name, ' ', IFNULL(CONCAT(ist.middle_name, ' '), ''), ist.last_name)
  ELSE a.username
END AS user_display_name
```

### 2. Frontend Display Update
**File**: `src/components/institution/ActivityLog.js`

- Updated to display `user_display_name` instead of `user_name`
- Added role badge display showing "(Main Admin)" or "(Staff)"
- Enhanced search to include username, display name, and role

### 3. Removed Redundant Column
**Files**: 
- `migration_create_activity_log_table.sql`
- `src/queries/academicInstitutionQueries.js`
- `src/routes/institutionRoutes.js`
- `src/services/activityLogService.js`

Removed the `user_name` column from the database since we now dynamically generate the display name from the JOIN query. This ensures:
- Data consistency (no duplicate storage)
- Automatic updates if user changes their name
- Proper distinction between admin and staff

### 4. User ID Tracking
**Files**: All component files

Updated all logging calls to use the actual logged-in user's ID from `localStorage.getItem('userId')` instead of always using the institution ID. This allows the system to:
- Track which specific staff member performed an action
- Distinguish between actions by main admin vs staff
- Provide accurate audit trail

## Database Schema

### Before
```sql
CREATE TABLE `activity_log` (
  ...
  `user_name` VARCHAR(255) DEFAULT NULL,  -- Redundant column
  ...
);
```

### After
```sql
CREATE TABLE `activity_log` (
  `user_id` INT NOT NULL COMMENT 'References account.id - can be institution admin or staff',
  -- user_name column removed
  -- Display name is generated via JOIN query
);
```

## Migration Notes

### If You Already Created the Table
If you already ran the migration with the `user_name` column, you can remove it:

```sql
ALTER TABLE `activity_log` DROP COLUMN `user_name`;
```

### Fresh Installation
Simply run the updated migration file:
```bash
mysql -u root -p verified_db < migration_create_activity_log_table.sql
```

## Benefits

1. **Accurate Attribution**: Shows exactly who performed each action
2. **Role Clarity**: Clear distinction between main admin and staff actions
3. **Data Consistency**: No duplicate storage of user information
4. **Automatic Updates**: If a staff member's name changes, it reflects immediately in logs
5. **Better Audit Trail**: Can track individual staff member activities

## Visual Improvements

### Role Badge Styling
Added a subtle badge to show user role:
- Light gray background
- Rounded corners
- Small, non-intrusive design
- Positioned next to the user's name

### Search Enhancement
Search now works across:
- User display names (full names or usernames)
- Usernames
- User roles (Main Admin, Staff)
- Action types
- Descriptions

## Testing Checklist

- [ ] Main admin performs action → Shows username with "(Main Admin)" badge
- [ ] Staff member performs action → Shows full name with "(Staff)" badge
- [ ] Search by username works
- [ ] Search by full name works
- [ ] Search by role works
- [ ] Logs display correctly after user name changes
- [ ] No database errors when creating logs
- [ ] Role badges display properly on mobile

## Files Modified

### Backend
1. `src/queries/academicInstitutionQueries.js` - Enhanced query with JOINs
2. `src/routes/institutionRoutes.js` - Removed user_name parameter
3. `migration_create_activity_log_table.sql` - Removed user_name column

### Frontend
4. `src/components/institution/ActivityLog.js` - Display user_display_name and role
5. `src/components/institution/ActivityLog.css` - Added role badge styling
6. `src/components/institution/InstitutionInformation.js` - Use logged-in user ID
7. `src/components/institution/StaffManagement.js` - Use logged-in user ID
8. `src/components/institution/ProgramManagement.js` - Use logged-in user ID

### Services
9. `src/services/activityLogService.js` - Removed user_name parameter from all functions

## Summary

The activity log now properly identifies and displays who performed each action:
- **Main admins** are shown by their username with a "Main Admin" badge
- **Staff members** are shown by their full name with a "Staff" badge
- The system uses database JOINs to dynamically generate display names
- All redundant data storage has been eliminated
- The audit trail is now more accurate and informative
