# Activity Log Implementation Guide

## Overview
This document describes the activity log system implemented for the institution settings page. The system tracks all CRUD operations performed by institution admins and staff members.

## Features
- **Comprehensive Tracking**: Monitors all major actions in institution settings including:
  - Profile updates (username, email, password changes)
  - Staff management (adding/deleting staff members)
  - Program management (adding/deleting programs)
  - Credential issuance and deletion
  - Student management operations
  
- **Isolated Styling**: Separate CSS file (`ActivityLog.css`) ensures no interference with other pages
- **Real-time Updates**: Activity logs are displayed in real-time with refresh capability
- **Filtering & Search**: Filter by action type and search through log descriptions
- **Pagination**: Handles large volumes of logs with client-side pagination
- **User-Friendly Display**: Relative timestamps, color-coded actions, and intuitive icons

## Database Schema

### Table: `activity_log`
```sql
CREATE TABLE `activity_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `institution_id` INT NOT NULL,
  `action` ENUM(
    'credential_issued',
    'credential_deleted',
    'credential_viewed',
    'student_added',
    'student_deleted',
    'student_imported',
    'profile_updated',
    'address_updated',
    'staff_added',
    'staff_deleted',
    'program_added',
    'program_deleted',
    'login',
    'logout',
    'settings_viewed',
    'other'
  ) NOT NULL DEFAULT 'other',
  `description` TEXT,
  `target_id` INT DEFAULT NULL,
  `target_type` VARCHAR(50) DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_name` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_institution_id` (`institution_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `account`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`institution_id`) REFERENCES `institution`(`id`) ON DELETE CASCADE
);
```

## File Structure

### Frontend Components
```
src/
├── components/
│   └── institution/
│       ├── ActivityLog.js          # Main activity log component
│       ├── ActivityLog.css         # Isolated styles for activity log
│       ├── InstitutionSettings.js  # Updated with activity log tab
│       ├── InstitutionInformation.js  # Integrated logging
│       ├── StaffManagement.js      # Integrated logging
│       └── ProgramManagement.js    # Integrated logging
└── services/
    └── activityLogService.js       # API service for activity logs
```

### Backend Files
```
src/
├── routes/
│   └── institutionRoutes.js        # Activity log API endpoints
└── queries/
    └── academicInstitutionQueries.js  # Database queries
```

### Migration File
```
migration_create_activity_log_table.sql  # Database migration script
```

## API Endpoints

### GET `/api/institution/:institutionId/activity-logs`
Fetch activity logs for an institution.

**Query Parameters:**
- `action` (optional): Filter by specific action type

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 5,
    "user_name": "University Admin",
    "action": "staff_added",
    "description": "Added staff member: John Doe",
    "target_type": "staff",
    "target_id": null,
    "ip_address": "192.168.1.1",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

### POST `/api/institution/activity-logs`
Create a new activity log entry.

**Request Body:**
```json
{
  "user_id": 5,
  "institution_id": 3,
  "action": "profile_updated",
  "description": "Updated institution profile: username, email",
  "target_type": "institution",
  "target_id": 3,
  "user_name": "University Admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Activity logged successfully",
  "log_id": 123
}
```

## Usage Examples

### Logging Profile Updates
```javascript
import { logProfileUpdate } from '../../services/activityLogService';

// After successful profile update
await logProfileUpdate(
  institutionId,
  userId,
  userName,
  'username, email'  // List of changed fields
);
```

### Logging Staff Operations
```javascript
import { logStaffAdded, logStaffDeleted } from '../../services/activityLogService';

// After adding staff
await logStaffAdded(institutionId, userId, userName, 'John Doe');

// After deleting staff
await logStaffDeleted(institutionId, userId, userName, 'Jane Smith');
```

### Logging Program Operations
```javascript
import { logProgramAdded, logProgramDeleted } from '../../services/activityLogService';

// After adding program
await logProgramAdded(institutionId, userId, userName, 'Computer Science');

// After deleting program
await logProgramDeleted(institutionId, userId, userName, 'Mathematics');
```

## Activity Log Component Features

### 1. Action Filtering
Users can filter logs by action type:
- All Actions
- Profile Updates
- Staff Added/Deleted
- Program Added/Deleted
- Credentials Issued
- Students Added

### 2. Search Functionality
Real-time search across:
- User names
- Action types
- Descriptions

### 3. Color-Coded Actions
- **Green**: Create operations (staff_added, program_added, etc.)
- **Blue**: Update operations (profile_updated)
- **Red**: Delete operations (staff_deleted, program_deleted)
- **Purple**: View operations (settings_viewed)
- **Gray**: Info operations (login, logout)
- **Orange**: Other operations

### 4. Responsive Design
- Mobile-friendly layout
- Adaptive filters and search
- Touch-optimized pagination

## Installation Steps

### 1. Run Database Migration
```bash
# Connect to your MySQL database
mysql -u your_username -p your_database < migration_create_activity_log_table.sql
```

### 2. Verify Installation
- Navigate to Institution Settings
- Click on the "Activity Log" tab
- Perform some actions (add staff, update profile, etc.)
- Verify logs appear in the Activity Log tab

## Security Considerations

1. **IP Address Logging**: Captures user IP for audit trail
2. **User Attribution**: Every action is linked to a user account
3. **Immutable Logs**: Logs cannot be edited, only created
4. **Cascade Deletion**: Logs are automatically deleted when institution/user is deleted
5. **Access Control**: Only institution admins and staff can view their institution's logs

## Performance Optimization

1. **Indexed Columns**: Database indexes on frequently queried columns
2. **Limited Results**: API returns maximum 500 most recent logs
3. **Client-Side Pagination**: Reduces server load for large datasets
4. **Async Logging**: Activity logging doesn't block user operations

## Troubleshooting

### Logs Not Appearing
1. Check database connection
2. Verify `activity_log` table exists
3. Check browser console for API errors
4. Ensure user has proper permissions

### Styling Issues
1. Verify `ActivityLog.css` is imported correctly
2. Check for CSS conflicts with global styles
3. Clear browser cache

### API Errors
1. Check server logs for detailed error messages
2. Verify institution ID is valid
3. Ensure database foreign key constraints are satisfied

## Future Enhancements

Potential improvements for future versions:
- Export logs to CSV/PDF
- Advanced filtering (date range, multiple actions)
- Email notifications for critical actions
- Log retention policies
- Detailed audit reports
- Integration with external logging services

## Support

For issues or questions:
1. Check this documentation
2. Review server logs
3. Inspect browser console
4. Verify database schema matches migration file
