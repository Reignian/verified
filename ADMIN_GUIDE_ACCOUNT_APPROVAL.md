# Admin Guide: Institution Account Approval

## Overview
This guide explains how to manage institution account requests in the VerifiED system.

## Accessing Account Requests

1. **Login to Admin Dashboard**
   - Navigate to `/login`
   - Click "Admin" toggle
   - Enter admin credentials
   - Click "Admin Login"

2. **Navigate to Institutions Tab**
   - Click "Institutions" in the admin navigation
   - Pending requests appear at the top of the list

## Understanding Account Status

### Status Badges

| Status | Badge Color | Icon | Meaning |
|--------|-------------|------|---------|
| **Pending** | Yellow | ⏰ Clock | New account awaiting approval |
| **Approved** | Green | ✓ Check | Account approved and active |
| **Rejected** | Red | ✗ X | Account request denied |

## Reviewing Pending Accounts

### Information Available
- **Institution Name**: Official name of the institution
- **Username**: Login username chosen by user
- **Email**: Contact email address
- **Created Date**: When the request was submitted

### What to Verify
1. **Legitimacy**: Is this a real academic institution?
2. **Email Domain**: Does the email match the institution?
3. **Duplicate Check**: Is there already an account for this institution?
4. **Information Accuracy**: Does the information look correct?

## Approving an Account

### Steps:
1. Review the pending account details
2. Click the **green checkmark (✓)** button
3. Confirm the approval in the popup dialog
4. The account status changes to "Approved"
5. The institution can now login

### What Happens After Approval:
- Account status changes from "pending" to "approved"
- User can login with their credentials
- Upon first login, user will be prompted to add MetaMask public address
- User gains access to institution dashboard features

## Rejecting an Account

### Steps:
1. Review the pending account details
2. Click the **red X (✗)** button
3. Confirm the rejection in the popup dialog
4. The account status changes to "Rejected"

### What Happens After Rejection:
- Account status changes from "pending" to "rejected"
- User cannot login (receives rejection message)
- Account appears in the list with red badge
- Edit button is disabled for rejected accounts
- Account can be deleted if needed

### When to Reject:
- Fraudulent or fake institution
- Duplicate account request
- Incomplete or suspicious information
- Email domain doesn't match institution
- Institution not eligible for the system

## Managing Approved Accounts

### Available Actions:
- **Edit**: Modify username, email, or institution name
- **Delete**: Permanently remove the account (soft delete)

### Editing an Account:
1. Click the **pencil icon** button
2. Modify the desired fields
3. Click "Update Institution"
4. Changes are saved immediately

**Note**: Password cannot be changed through admin interface for security reasons.

## Creating Accounts Directly (Admin)

### When to Use:
- Pre-approved institutions
- Partner institutions
- Trusted organizations

### Steps:
1. Click "Add Institution" button
2. Fill in all required fields:
   - Institution Name
   - Username
   - Email
   - Password
3. Click "Create Institution"

### Important:
- Admin-created accounts are **automatically approved**
- No pending status - institution can login immediately
- Useful for expedited onboarding

## Best Practices

### ✅ Do:
- Review accounts within 24-48 hours
- Verify institution legitimacy before approving
- Check for duplicate accounts
- Keep records of rejection reasons (external system)
- Communicate with institutions about their status

### ❌ Don't:
- Approve without verification
- Share admin credentials
- Delete accounts without backup
- Approve duplicate institutions
- Ignore pending requests for extended periods

## Common Scenarios

### Scenario 1: Legitimate Institution Request
**Action**: Approve immediately
**Result**: Institution gains access

### Scenario 2: Suspicious Request
**Action**: Reject and document reason
**Result**: User cannot access system

### Scenario 3: Duplicate Request
**Action**: Reject new request, inform user of existing account
**Result**: User directed to existing account

### Scenario 4: Partner Institution
**Action**: Create account directly as admin
**Result**: Immediate access without waiting

### Scenario 5: Rejected User Re-applies
**Action**: Delete old rejected account, review new request
**Result**: Fresh evaluation of application

## Monitoring Dashboard

### Key Metrics:
- **Total Institutions**: All institution accounts
- **Pending Requests**: Awaiting approval (check regularly)
- **Daily Verifications**: System usage indicator

### Regular Tasks:
- Check for pending requests daily
- Review approved accounts monthly
- Clean up rejected accounts quarterly
- Monitor system statistics

## Troubleshooting

### User Can't Login After Approval
1. Verify account status is "approved" in database
2. Check username/email spelling
3. Verify password was set correctly during signup
4. Check for browser cache issues

### Approval Button Not Working
1. Refresh the page
2. Check browser console for errors
3. Verify admin permissions
4. Try different browser

### Account Not Appearing in List
1. Refresh the institutions list
2. Check if account was created successfully in database
3. Verify account_type is 'institution'
4. Check for database connection issues

## Security Notes

⚠️ **Important Security Considerations**:
- Only approve institutions you can verify
- Never share approval credentials
- Log all approval/rejection actions (future enhancement)
- Monitor for suspicious patterns
- Report security concerns immediately

## Support

For technical issues or questions:
- Contact system administrator
- Check system logs
- Review database records
- Consult development team

---

**Last Updated**: October 26, 2025
**Version**: 1.0
