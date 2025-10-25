# Signup Request via Messages Tab - Implementation Guide

## Overview
Modified the institution signup system to send requests to the admin's **Messages tab** instead of a separate Institutions tab. Admin can approve/reject directly from Messages, and email notifications are automatically sent to users.

## Key Changes from Previous Implementation

### Previous Flow:
1. User signs up → Account created with "pending" status
2. Admin goes to **Institutions tab** → Sees pending accounts
3. Admin clicks Approve/Reject buttons
4. No email notifications

### New Flow:
1. User signs up → Account created with "pending" status
2. **Message automatically created** in contact_messages table
3. Admin goes to **Messages tab** → Sees signup request with special badge
4. Admin clicks **Approve/Reject** buttons in Messages tab
5. **Email automatically sent** to user (approval or rejection)
6. Message marked as "replied"

## Database Changes

### 1. contact_messages Table Updates

```sql
ALTER TABLE `contact_messages` 
ADD COLUMN `message_type` ENUM('contact','signup_request') 
COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'contact' 
AFTER `status`;

ALTER TABLE `contact_messages` 
ADD COLUMN `account_id` INT DEFAULT NULL 
AFTER `message_type`;
```

**Fields Added:**
- `message_type`: Distinguishes between regular contact messages and signup requests
- `account_id`: Links signup request messages to the created account

### 2. account Table (Already Done)

```sql
ALTER TABLE `account` 
ADD COLUMN `status` ENUM('pending','approved','rejected') 
COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'approved' 
AFTER `email`;
```

## Backend Implementation

### 1. Email Service (`src/services/emailService.js`)

**New file created** with nodemailer integration:

#### Functions:
- `sendApprovalEmail(recipientEmail, institutionName, username)`
  - Sends HTML email with approval notification
  - Includes login link and next steps
  - Professional template with branding

- `sendRejectionEmail(recipientEmail, institutionName, username)`
  - Sends HTML email with rejection notification
  - Explains possible reasons
  - Provides support contact information

#### Configuration:
Uses environment variables for email setup:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@verified.com
APP_URL=http://localhost:3000
```

**Note:** If email is not configured, emails are logged to console for development.

### 2. Signup Route Update (`src/routes/authRoutes.js`)

**Modified:** POST `/api/auth/signup`

After creating the account, now also creates a message:

```javascript
const messageQuery = `
  INSERT INTO contact_messages (name, email, user_type, message, status, message_type, account_id, created_at)
  VALUES (?, ?, 'institution', ?, 'unread', 'signup_request', ?, NOW())
`;
const messageText = `New institution signup request from ${institution_name}.\n\nUsername: ${username}\nEmail: ${email}\n\nPlease review and approve or reject this request.`;

db.query(messageQuery, [institution_name, email, messageText, accountId], ...);
```

### 3. New Admin Routes (`src/routes/adminRoutes.js`)

#### POST `/api/admin/contact-messages/:id/approve-signup`
- Retrieves message and linked account
- Approves the institution account
- Updates message status to 'replied'
- Sends approval email
- Returns success response

#### POST `/api/admin/contact-messages/:id/reject-signup`
- Retrieves message and linked account
- Rejects the institution account
- Updates message status to 'replied'
- Sends rejection email
- Returns success response

### 4. Admin Queries Update (`src/queries/adminQueries.js`)

**Modified:** `getAllContactMessages()`

Now includes:
- `message_type` field
- `account_id` field
- Sorting: Signup requests appear first, then by status, then by date

```javascript
ORDER BY 
  CASE message_type 
    WHEN 'signup_request' THEN 1 
    WHEN 'contact' THEN 2 
  END,
  CASE status 
    WHEN 'unread' THEN 1 
    WHEN 'read' THEN 2 
    WHEN 'replied' THEN 3 
  END,
  created_at DESC
```

## Frontend Implementation

### 1. Admin API Service (`src/services/adminApiService.js`)

**New functions added:**

```javascript
export const approveSignupRequest = async (messageId) => {
  const response = await axios.post(`${API_URL}/admin/contact-messages/${messageId}/approve-signup`);
  return response.data;
};

export const rejectSignupRequest = async (messageId) => {
  const response = await axios.post(`${API_URL}/admin/contact-messages/${messageId}/reject-signup`);
  return response.data;
};
```

### 2. ContactMessages Component (`src/components/admin/ContactMessages.js`)

#### New Features:

**1. Message Type Badge:**
```javascript
const getMessageTypeBadge = (messageType) => {
  if (messageType === 'signup_request') {
    return (
      <span className="badge bg-warning text-dark">
        <i className="fas fa-user-plus me-1"></i>
        Signup Request
      </span>
    );
  }
  return null;
};
```

**2. Approve/Reject Handlers:**
```javascript
const handleApproveSignup = async (messageId) => {
  // Confirms action
  // Calls API
  // Reloads messages
  // Shows success alert
};

const handleRejectSignup = async (messageId) => {
  // Confirms action
  // Calls API
  // Reloads messages
  // Shows success alert
};
```

**3. Conditional Action Buttons:**
- **For Signup Requests (unread/read):**
  - Green "Approve" button
  - Red "Reject" button
  - View Details button

- **For Regular Messages:**
  - View Message button
  - Reply via Gmail button
  - Mark as Replied button
  - Delete button

- **For Processed Signup Requests (replied):**
  - Same as regular messages (can view/delete)

**4. Visual Indicators:**
- Yellow "Signup Request" badge appears under sender name
- Signup requests sorted to top of list
- Unread messages highlighted with yellow background

## User Experience Flow

### For Institution Users:

1. **Sign Up:**
   - Fill out signup form
   - Submit request
   - See success message

2. **Wait for Approval:**
   - Account status: "pending"
   - Cannot login yet
   - Receives email when processed

3. **After Approval:**
   - Receives approval email with:
     - Login credentials reminder
     - Login link
     - Next steps instructions
   - Can now login
   - Prompted to add MetaMask address

4. **After Rejection:**
   - Receives rejection email with:
     - Explanation of possible reasons
     - Support contact information
   - Cannot login
   - Can contact support for clarification

### For Admin Users:

1. **Receive Notification:**
   - New message appears in Messages tab
   - Yellow "Signup Request" badge visible
   - Appears at top of message list
   - Unread status (yellow highlight)

2. **Review Request:**
   - Click to view full details
   - See institution name, username, email
   - Review message content

3. **Make Decision:**
   - Click "Approve" button → Confirmation dialog → Email sent
   - OR Click "Reject" button → Confirmation dialog → Email sent
   - Message marked as "replied"
   - Success notification shown

4. **After Processing:**
   - Message remains in list with "replied" status
   - Can view details anytime
   - Can delete if needed
   - Institution can login (if approved) or receives rejection notice

## Email Templates

### Approval Email Features:
- ✅ Professional HTML design
- ✅ Gradient header with celebration emoji
- ✅ Login credentials reminder
- ✅ Direct login button/link
- ✅ Next steps checklist
- ✅ Support contact information
- ✅ Responsive design

### Rejection Email Features:
- ✅ Professional HTML design
- ✅ Respectful tone
- ✅ Explanation of possible reasons
- ✅ Instructions for further action
- ✅ Support contact information
- ✅ Responsive design

## Configuration Requirements

### Email Setup (Required for Production):

1. **Gmail (Recommended for Development):**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-specific-password
   ```

2. **SendGrid:**
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=your-sendgrid-api-key
   ```

3. **Custom SMTP:**
   ```env
   EMAIL_HOST=your-smtp-host.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-username
   EMAIL_PASS=your-password
   ```

### Environment Variables:
```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@verified.com
EMAIL_PASS=your-app-password
EMAIL_FROM=VerifiED <noreply@verified.com>

# Application URL
APP_URL=http://localhost:3000
```

## Testing Checklist

### Sign-Up Flow:
- [ ] User can access signup page
- [ ] Form validation works correctly
- [ ] Account created with "pending" status
- [ ] Message created in contact_messages table
- [ ] Message appears in admin Messages tab
- [ ] Signup request badge displayed
- [ ] Cannot login with pending account

### Admin Approval:
- [ ] Signup request appears at top of Messages list
- [ ] Yellow badge visible
- [ ] Approve button works
- [ ] Confirmation dialog appears
- [ ] Account status changes to "approved"
- [ ] Message status changes to "replied"
- [ ] Email sent successfully (check console if not configured)
- [ ] User can now login

### Admin Rejection:
- [ ] Reject button works
- [ ] Confirmation dialog appears
- [ ] Account status changes to "rejected"
- [ ] Message status changes to "replied"
- [ ] Email sent successfully
- [ ] User cannot login (receives rejection message)

### Email Notifications:
- [ ] Approval email received
- [ ] Email has correct content and formatting
- [ ] Login link works
- [ ] Rejection email received
- [ ] Email has correct content and formatting

### Edge Cases:
- [ ] Multiple signup requests handled correctly
- [ ] Processed requests don't show approve/reject buttons
- [ ] Regular contact messages still work normally
- [ ] Email failures don't break approval/rejection
- [ ] Message filtering works with signup requests

## Files Modified/Created

### New Files:
1. `src/services/emailService.js` - Email notification service
2. `migration_add_signup_request_fields.sql` - Database migration
3. `SIGNUP_MESSAGES_IMPLEMENTATION.md` - This documentation

### Modified Files:
1. `verified_db.sql` - Added message_type and account_id columns
2. `src/routes/authRoutes.js` - Added message creation on signup
3. `src/routes/adminRoutes.js` - Added approve/reject routes
4. `src/queries/adminQueries.js` - Updated getAllContactMessages query
5. `src/services/adminApiService.js` - Added approve/reject API functions
6. `src/components/admin/ContactMessages.js` - Added approve/reject UI

## Advantages of This Approach

### ✅ Centralized Management:
- All communications in one place
- No need to switch between tabs
- Unified message handling

### ✅ Better User Experience:
- Automatic email notifications
- Clear status updates
- Professional communication

### ✅ Audit Trail:
- All requests logged in messages
- Timestamps for all actions
- Easy to review history

### ✅ Flexibility:
- Can add notes/comments in future
- Can implement email threading
- Can add more notification types

### ✅ Consistency:
- Same interface for all admin communications
- Familiar workflow for admins
- Reduces training time

## Future Enhancements

### Potential Improvements:
1. **Email Templates Editor** - Allow admins to customize email content
2. **Rejection Reasons** - Add dropdown for rejection reason selection
3. **Bulk Actions** - Approve/reject multiple requests at once
4. **Email Tracking** - Track if emails were opened/clicked
5. **SMS Notifications** - Add SMS option for urgent requests
6. **Automated Approval** - Auto-approve based on criteria (email domain, etc.)
7. **Request Notes** - Allow admins to add internal notes
8. **Applicant Dashboard** - Show request status to applicants
9. **Re-submission** - Allow rejected users to reapply
10. **Document Upload** - Require proof of institution legitimacy

## Troubleshooting

### Email Not Sending:
- Check environment variables are set correctly
- Verify SMTP credentials
- Check firewall/port settings
- Review console logs for errors
- Test with a different email service

### Approve/Reject Not Working:
- Check browser console for errors
- Verify API routes are accessible
- Check database connection
- Review server logs
- Ensure message_type is 'signup_request'

### Messages Not Appearing:
- Verify message was created in database
- Check message_type field value
- Refresh Messages tab
- Clear filters
- Check sorting order

## Support

For issues or questions:
- Check server logs: `npm run server`
- Check browser console: F12 → Console tab
- Review database: Check contact_messages table
- Test email: Check console output if not configured
- Contact development team for assistance

---

**Last Updated**: January 26, 2025
**Version**: 2.0 (Messages Tab Integration)
