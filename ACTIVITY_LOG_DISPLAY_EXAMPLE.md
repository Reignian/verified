# Activity Log Display Examples

## How the Activity Log Now Displays Users

### Example 1: Main Admin Actions
When the main institution admin performs actions, the log shows their **username** from the account table:

```
┌─────────────────────────────────────────────────────────────┐
│ 👤 admin_user (Main Admin) Profile Updated                  │
│    Updated institution profile: username, email             │
│    🕐 2 hours ago  🌐 192.168.1.100                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 👥 admin_user (Main Admin) Staff Added                      │
│    Added staff member: John Smith                           │
│    🕐 5 hours ago  🌐 192.168.1.100                         │
└─────────────────────────────────────────────────────────────┘
```

### Example 2: Staff Member Actions
When a staff member performs actions, the log shows their **full name** from the institution_staff table:

```
┌─────────────────────────────────────────────────────────────┐
│ 👤 Maria Garcia Santos (Staff) Program Added                │
│    Added program: Computer Science                          │
│    🕐 1 hour ago  🌐 192.168.1.105                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🗑️ John Michael Smith (Staff) Staff Deleted                 │
│    Deleted staff member: Jane Doe                           │
│    🕐 3 hours ago  🌐 192.168.1.105                         │
└─────────────────────────────────────────────────────────────┘
```

### Example 3: Mixed Activity Log
A typical activity log showing both admin and staff actions:

```
Activity Log
────────────────────────────────────────────────────────────────

Filter: All Actions                    Search: [          🔍]

┌─────────────────────────────────────────────────────────────┐
│ 👤 Maria Garcia Santos (Staff) Program Added                │
│    Added program: Computer Science                          │
│    🕐 Just now  🌐 192.168.1.105                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 👥 admin_user (Main Admin) Staff Added                      │
│    Added staff member: Maria Garcia Santos                  │
│    🕐 30 minutes ago  🌐 192.168.1.100                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 👤 admin_user (Main Admin) Profile Updated                  │
│    Updated institution profile: email                       │
│    🕐 1 hour ago  🌐 192.168.1.100                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🎓 John Michael Smith (Staff) Program Deleted               │
│    Deleted program: Old Curriculum                          │
│    🕐 2 hours ago  🌐 192.168.1.108                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 👥 admin_user (Main Admin) Staff Deleted                    │
│    Deleted staff member: Former Employee                    │
│    🕐 1 day ago  🌐 192.168.1.100                           │
└─────────────────────────────────────────────────────────────┘

                    ◄ Previous  Page 1 of 3  Next ►
```

## Key Visual Elements

### User Display Format
- **Main Admin**: `username (Main Admin)`
  - Example: `admin_user (Main Admin)`
  - Example: `institution_admin (Main Admin)`

- **Staff**: `First Middle Last (Staff)`
  - Example: `Maria Garcia Santos (Staff)`
  - Example: `John Smith (Staff)` (no middle name)

### Role Badge Styling
The role badge appears in a subtle gray pill:
```
┌──────────────────┐
│ (Main Admin)     │  ← Light gray background, rounded
└──────────────────┘

┌──────────────────┐
│ (Staff)          │  ← Light gray background, rounded
└──────────────────┘
```

### Color Coding by Action Type
- 🟢 **Green**: Create actions (staff_added, program_added, student_added)
- 🔵 **Blue**: Update actions (profile_updated)
- 🔴 **Red**: Delete actions (staff_deleted, program_deleted)
- 🟣 **Purple**: View actions (settings_viewed)
- ⚫ **Gray**: Info actions (login, logout)
- 🟠 **Orange**: Other actions

## Search Functionality

### Search Examples

**Search: "Maria"**
```
Results: Shows all actions by "Maria Garcia Santos"
```

**Search: "admin"**
```
Results: Shows all actions by users with "admin" in username
         OR actions by users with "Main Admin" role
```

**Search: "Staff"**
```
Results: Shows all actions performed by staff members
```

**Search: "added"**
```
Results: Shows all "staff_added", "program_added", "student_added" actions
```

## Database Behind the Scenes

### How It Works

1. **Activity log stores only user_id**:
   ```sql
   activity_log table:
   id | user_id | institution_id | action | description
   1  | 5       | 3              | staff_added | Added staff member: John
   ```

2. **Query JOINs with account table**:
   ```sql
   account table:
   id | username      | account_type
   5  | admin_user    | institution
   ```

3. **Query LEFT JOINs with institution_staff table**:
   ```sql
   institution_staff table:
   id | first_name | middle_name | last_name
   8  | Maria      | Garcia      | Santos
   ```

4. **Result combines the data**:
   ```
   For user_id=5 (institution): Display "admin_user (Main Admin)"
   For user_id=8 (staff): Display "Maria Garcia Santos (Staff)"
   ```

## Benefits of This Approach

✅ **Accurate**: Shows exactly who did what
✅ **Clear**: Easy to distinguish between admin and staff
✅ **Consistent**: Names update automatically if changed
✅ **Searchable**: Can search by name, username, or role
✅ **Audit-Ready**: Complete trail of who performed each action

## Mobile View

On mobile devices, the layout adapts:

```
┌─────────────────────────┐
│ 👤 Maria Garcia Santos  │
│    (Staff)              │
│    Program Added        │
│                         │
│ Added program:          │
│ Computer Science        │
│                         │
│ 🕐 Just now             │
│ 🌐 192.168.1.105        │
└─────────────────────────┘
```

The role badge and action details stack vertically for better readability on smaller screens.
