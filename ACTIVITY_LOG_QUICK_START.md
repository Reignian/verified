# Activity Log - Quick Start Guide

## What Was Created

A comprehensive activity logging system for the institution settings page that tracks all CRUD operations performed by admins and staff.

## Files Created/Modified

### New Files
1. **`src/components/institution/ActivityLog.js`** - Main activity log component
2. **`src/components/institution/ActivityLog.css`** - Isolated styles (won't affect other pages)
3. **`src/services/activityLogService.js`** - API service for logging activities
4. **`migration_create_activity_log_table.sql`** - Database migration script
5. **`ACTIVITY_LOG_IMPLEMENTATION.md`** - Detailed documentation

### Modified Files
1. **`src/components/institution/InstitutionSettings.js`** - Added Activity Log tab
2. **`src/components/institution/InstitutionInformation.js`** - Integrated logging for profile updates
3. **`src/components/institution/StaffManagement.js`** - Integrated logging for staff operations
4. **`src/components/institution/ProgramManagement.js`** - Integrated logging for program operations
5. **`src/routes/institutionRoutes.js`** - Added API endpoints for activity logs
6. **`src/queries/academicInstitutionQueries.js`** - Added database query functions

## Installation (3 Steps)

### Step 1: Run Database Migration
```bash
# Navigate to your project directory
cd c:\xampp\htdocs\verified

# Run the migration (adjust credentials as needed)
mysql -u root -p verified_db < migration_create_activity_log_table.sql
```

Or manually execute in phpMyAdmin/MySQL Workbench:
- Open `migration_create_activity_log_table.sql`
- Copy and execute the SQL commands

### Step 2: Restart Your Backend Server
```bash
# Stop the current server (Ctrl+C)
# Then restart
node server.js
```

### Step 3: Test the Feature
1. Open your browser and navigate to the institution dashboard
2. Go to **Settings** page
3. You should see a new **Activity Log** tab
4. Perform some actions:
   - Update your profile
   - Add a staff member
   - Add a program
5. Click the **Activity Log** tab to see all tracked actions

## What Gets Logged

The system automatically logs these actions:

### Profile Management
- ✅ Profile updates (username, email, password changes)

### Staff Management
- ✅ Staff member added
- ✅ Staff member deleted

### Program Management
- ✅ Program added
- ✅ Program deleted

### Future: Can Be Extended To
- Credential issuance
- Student additions/deletions
- Student bulk imports
- Settings views
- Login/logout events

## User Display

The activity log shows **who** performed each action:

- **Main Admin**: Displays username from account table
  - Example: `admin_user (Main Admin) Profile Updated`
  
- **Staff**: Displays full name from institution_staff table
  - Example: `Maria Garcia Santos (Staff) Program Added`

This makes it easy to track whether the main admin or a specific staff member performed an action.

## Features Overview

### 1. Activity Log Tab
- New tab in Institution Settings
- Shows chronological list of all actions
- Color-coded by action type
- Real-time updates

### 2. Filtering
- Filter by action type (All, Profile Updates, Staff Added, etc.)
- Search across user names and descriptions

### 3. Pagination
- 20 logs per page
- Easy navigation between pages

### 4. Details Shown
- Who performed the action
- What action was performed
- When it happened (relative time)
- IP address of the user
- Detailed description

## Styling Isolation

The `ActivityLog.css` file uses specific class names that won't conflict with other pages:
- All classes are prefixed with `activity-log-*`
- No global style overrides
- Safe to use alongside existing styles

## Troubleshooting

### Issue: "Activity Log tab not showing"
**Solution:** Clear browser cache and refresh

### Issue: "Logs not appearing after actions"
**Solution:** 
1. Check browser console for errors
2. Verify database migration ran successfully
3. Ensure backend server restarted

### Issue: "Database error when viewing logs"
**Solution:**
1. Verify `activity_log` table exists in database
2. Check foreign key constraints are satisfied
3. Review server logs for detailed error

### Issue: "Styling looks broken"
**Solution:**
1. Ensure `ActivityLog.css` is in the correct location
2. Clear browser cache
3. Check browser console for CSS loading errors

## Quick Test Checklist

- [ ] Database migration completed successfully
- [ ] Backend server restarted
- [ ] Activity Log tab visible in Institution Settings
- [ ] Can add a staff member and see it logged
- [ ] Can delete a staff member and see it logged
- [ ] Can update profile and see it logged
- [ ] Can add a program and see it logged
- [ ] Can delete a program and see it logged
- [ ] Can filter logs by action type
- [ ] Can search through logs
- [ ] Pagination works correctly

## Next Steps

After successful installation:

1. **Test thoroughly** - Perform various actions and verify they're logged
2. **Review logs** - Check that descriptions are clear and helpful
3. **Monitor performance** - Ensure logging doesn't slow down operations
4. **Extend if needed** - Add logging to other actions (credentials, students, etc.)

## Need Help?

Refer to `ACTIVITY_LOG_IMPLEMENTATION.md` for:
- Detailed API documentation
- Database schema details
- Code examples
- Security considerations
- Performance optimization tips

## Summary

You now have a complete activity logging system that:
- ✅ Tracks all major actions in institution settings
- ✅ Uses isolated CSS to avoid conflicts
- ✅ Provides filtering and search capabilities
- ✅ Shows detailed information about each action
- ✅ Is ready for production use

The system is designed to be maintainable, scalable, and user-friendly!
