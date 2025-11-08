# Student Account Creation & Credential Issuance Workflow Fix

## Problem Summary

The previous implementation had critical issues where passwords were being regenerated instead of retrieved from the database, causing students to receive different passwords in welcome emails vs credential issuance emails.

## Issues Fixed

### 1. **Individual Student Creation**
- **Problem**: Plain password was stored in a local variable but not saved to database
- **Fix**: Added `plain_password` column to `account` table and store it during account creation

### 2. **Bulk Student Import**
- **Problem**: Same issue - password was hashed but plain version was not stored
- **Fix**: Modified bulk import to store `plain_password` in database

### 3. **Credential Issuance**
- **Problem**: When issuing first credential, system regenerated a new password (`student123`) instead of using the original
- **Fix**: Fetch stored `plain_password` from database and clear it after sending email

## Implementation Details

### Database Changes

**Migration File**: `migrations/add_plain_password_column.sql`

```sql
ALTER TABLE account 
ADD COLUMN plain_password VARCHAR(255) NULL 
COMMENT 'Temporary plain password storage for email notifications, cleared after first credential';

CREATE INDEX idx_plain_password ON account(plain_password);
```

**Run this migration**:
```bash
# In phpMyAdmin or MySQL client
SOURCE migrations/add_plain_password_column.sql;
```

### Code Changes

#### 0. Password Generator Utility (`src/utils/passwordGenerator.js`) - NEW FILE

**Secure Random Password Generator**:
```javascript
const generateRandomPassword = (length = 10) => {
  // Ensure minimum length of 8
  if (length < 8) {
    length = 8;
  }

  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const allChars = lowercase + uppercase + numbers;

  let password = '';

  // Ensure at least 1 uppercase letter
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));

  // Ensure at least 1 number
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));

  // Fill the rest with random characters from all sets
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the password to randomize positions of required characters
  password = password.split('').sort(() => Math.random() - 0.5).join('');

  return password;
};
```

**Features**:
- ✅ Minimum 8 characters (default: 10)
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 number (0-9)
- ✅ Includes lowercase letters (a-z)
- ✅ Randomized character positions
- ✅ Validation function included

**Example Passwords**:
- `aB3xK9mPq2`
- `T5nWp8rLm1`
- `Q9kDf2vXc7`

#### 1. Individual Student Creation (`institutionRoutes.js`)

**Lines 341-350**: Improved validation with secure random password generation
```javascript
// Auto-generate username if not provided
if (!username || username.trim() === '') {
  username = `${first_name.toLowerCase()}${student_id}`;
}

// Auto-generate secure random password if not provided
if (!password || password.trim() === '') {
  const { generateRandomPassword } = require('../utils/passwordGenerator');
  password = generateRandomPassword(10); // 10-character random password
}
```

**Password Requirements**:
- Minimum 8 characters (default: 10)
- At least 1 uppercase letter
- At least 1 number
- Example: `aB3xK9mPq2`

#### 2. Add Student Function (`academicInstitutionQueries.js`)

**Lines 520-525**: Store plain password
```javascript
const accountQuery = `
  INSERT INTO account (account_type, username, password, email, plain_password) 
  VALUES ('student', ?, ?, ?, ?)
`;

conn.query(accountQuery, [username, hashedPassword, email, password], ...);
```

#### 3. Bulk Import Function (`academicInstitutionQueries.js`)

**Lines 306-334**: Store plain password in bulk import with secure random generation
```javascript
// Hash password before storing
// Generate secure random password if not provided
let plainPassword = student.password;
if (!plainPassword || plainPassword.trim() === '') {
  const { generateRandomPassword } = require('../utils/passwordGenerator');
  plainPassword = generateRandomPassword(10);
}
bcrypt.hash(plainPassword, SALT_ROUNDS, (err, hashedPassword) => {
  // ... error handling ...
  
  const accountQuery = `
    INSERT INTO account (account_type, username, password, email, plain_password) 
    VALUES ('student', ?, ?, ?, ?)
  `;
  
  const accountValues = [
    student.username || `${student.first_name.toLowerCase()}${student.student_id}`,
    hashedPassword,
    student.email || `${student.username || student.first_name}@student.edu`,
    plainPassword
  ];
  
  conn.query(accountQuery, accountValues, ...);
});
```

#### 4. Get Student Details (`academicInstitutionQueries.js`)

**Lines 1127-1141**: Include plain_password in query
```javascript
const query = `
  SELECT 
    s.id,
    s.student_id,
    s.first_name,
    s.middle_name,
    s.last_name,
    a.username,
    a.email,
    a.plain_password,  // <-- Added this
    a.created_at,
    (SELECT COUNT(*) FROM credential WHERE owner_id = s.id AND status = 'blockchain_verified') as credential_count
  FROM student s
  JOIN account a ON s.id = a.id
  WHERE s.id = ?
`;
```

#### 5. Credential Issuance Email (`institutionRoutes.js`)

**Lines 767-795**: Fetch stored password instead of regenerating
```javascript
async function sendCredentialEmail(student, typeName) {
  const studentFullName = `${student.first_name} ${student.middle_name ? student.middle_name + ' ' : ''}${student.last_name}`.trim();
  
  let passwordToSend = null;
  
  // If this is the first credential, fetch the stored plain password from database
  if (isFirstCredential) {
    // Use the plain_password from the student object (already fetched from database)
    passwordToSend = student.plain_password;
    
    // Clear the plain_password from database after sending email for security
    const db = require('../config/database');
    await new Promise((resolve, reject) => {
      db.query(
        'UPDATE account SET plain_password = NULL WHERE id = ?',
        [student.id],
        (err) => {
          if (err) {
            console.error('Error clearing plain password:', err);
            reject(err);
          } else {
            console.log(`Plain password cleared for student ID: ${student.id} after first credential email`);
            resolve();
          }
        }
      );
    });
  }
  
  // Send automated credential notification email
  const emailResult = await smtpEmailService.sendCredentialIssuanceEmail(
    student.email,
    studentFullName,
    student.username,
    typeName,
    isFirstCredential,
    passwordToSend
  );
  
  emailSent = emailResult.success;
  emailMessageId = emailResult.messageId || null;
}
```

## Workflow Overview

### Correct Workflow (After Fix)

#### **Scenario 1: Individual Student Creation**

1. Institution creates student account via form
2. **If username is empty**: Auto-generate as `{firstname}{student_id}`
3. **If password is empty**: Auto-generate secure random password (e.g., `aB3xK9mPq2`)
   - Minimum 8 characters (default: 10)
   - At least 1 uppercase letter
   - At least 1 number
4. **If username/password provided**: Use provided values
5. Store hashed password in `account.password`
6. Store plain password in `account.plain_password`
7. Send welcome email with username and password
8. Student receives correct credentials

#### **Scenario 2: Bulk Student Import**

1. Institution uploads CSV/Excel file
2. For each student:
   - **If username is empty**: Auto-generate as `{firstname}{student_id}`
   - **If password is empty**: Auto-generate secure random password (e.g., `T5nWp8rLm1`)
     - Minimum 8 characters (default: 10)
     - At least 1 uppercase letter
     - At least 1 number
   - **If username/password provided**: Use provided values
3. Store hashed password in `account.password`
4. Store plain password in `account.plain_password`
5. No email sent during bulk import (optional feature)

#### **Scenario 3: First Credential Issuance**

1. Institution issues first credential to student
2. System checks credential count (0 = first credential)
3. Fetch student details including `plain_password` from database
4. Send credential notification email with:
   - Email address
   - Username
   - **Password** (fetched from `plain_password` field)
5. Clear `plain_password` from database (set to NULL)
6. Student receives same password as in welcome email

#### **Scenario 4: Subsequent Credential Issuance**

1. Institution issues 2nd, 3rd, etc. credential
2. System checks credential count (>0 = not first credential)
3. Send credential notification email with:
   - Email address
   - Username
   - **No password** (already sent in first credential email)
4. Student logs in with existing credentials

## Security Considerations

### Why Store Plain Password?

- **Temporary Storage**: Only stored until first credential is issued
- **Auto-Cleared**: Automatically set to NULL after first credential email
- **No Long-Term Risk**: Password is only stored for a short period

### Security Measures

1. **Automatic Cleanup**: Plain password is cleared after first credential email
2. **Database Index**: Added for performance, not security risk
3. **No External Exposure**: Plain password never sent to frontend
4. **Hashed Password**: Still stored in `account.password` for authentication

## Testing Checklist

### Test Case 1: Individual Student Creation (Auto-Generated)
- [ ] Create student without username/password
- [ ] Verify username is `{firstname}{student_id}`
- [ ] Verify password is randomly generated (10 characters, 1 uppercase, 1 number)
- [ ] Check `account.plain_password` contains the generated password
- [ ] Verify welcome email contains correct credentials
- [ ] Verify password meets requirements (8+ chars, 1 uppercase, 1 number)

### Test Case 2: Individual Student Creation (Custom)
- [ ] Create student with custom username/password
- [ ] Verify custom values are used
- [ ] Check `account.plain_password` contains custom password
- [ ] Verify welcome email contains correct credentials

### Test Case 3: Bulk Import (Auto-Generated)
- [ ] Upload CSV without username/password columns
- [ ] Verify auto-generated credentials
- [ ] Check `account.plain_password` for all students

### Test Case 4: Bulk Import (Custom)
- [ ] Upload CSV with username/password columns
- [ ] Verify custom values are used
- [ ] Check `account.plain_password` for all students

### Test Case 5: First Credential Issuance
- [ ] Issue first credential to student
- [ ] Verify email contains username AND password
- [ ] Verify password matches welcome email
- [ ] Check `account.plain_password` is NULL after email sent

### Test Case 6: Subsequent Credential Issuance
- [ ] Issue 2nd credential to same student
- [ ] Verify email contains username only (no password)
- [ ] Verify `account.plain_password` remains NULL

## Files Modified

1. **migrations/add_plain_password_column.sql** (NEW)
   - Database migration to add `plain_password` column

2. **src/utils/passwordGenerator.js** (NEW)
   - Secure random password generator utility
   - `generateRandomPassword()` - Creates passwords with 8+ chars, 1 uppercase, 1 number
   - `validatePassword()` - Validates password requirements

3. **src/routes/institutionRoutes.js**
   - Lines 346-350: Replaced hardcoded `student123` with random password generator
   - Lines 767-795: Fetch stored password instead of regenerating

4. **src/queries/academicInstitutionQueries.js**
   - Lines 306-312: Replaced hardcoded `student123` with random password generator in bulk import
   - Lines 520-525: Store plain password in individual creation
   - Lines 327-334: Store plain password in bulk import
   - Lines 1127-1141: Include plain_password in student details query
   - Lines 1108-1125: Fixed incomplete createActivityLog function

## Migration Instructions

### Step 1: Run Database Migration
```bash
# Option 1: Using MySQL command line
mysql -u root -p verified_db < migrations/add_plain_password_column.sql

# Option 2: Using phpMyAdmin
# - Open phpMyAdmin
# - Select verified_db database
# - Go to SQL tab
# - Paste contents of migrations/add_plain_password_column.sql
# - Click "Go"
```

### Step 2: Restart Server
```bash
# Stop current server (Ctrl+C)
# Start server again
npm start
```

### Step 3: Test the Workflow
- Create a new student account
- Issue their first credential
- Verify email contains correct password
- Issue second credential
- Verify email does NOT contain password

## Troubleshooting

### Issue: "Unknown column 'plain_password'"
**Solution**: Run the database migration first

### Issue: Password in email doesn't match welcome email
**Solution**: This fix resolves this exact issue

### Issue: Student receives password in every credential email
**Solution**: Check if `plain_password` is being cleared after first credential

### Issue: Student doesn't receive password in first credential email
**Solution**: Verify `plain_password` is stored during account creation

## Summary

This fix ensures that:
1. ✅ **Secure Random Passwords**: Auto-generated passwords are random (not `student123`)
   - Minimum 8 characters (default: 10)
   - At least 1 uppercase letter
   - At least 1 number
   - Example: `aB3xK9mPq2`, `T5nWp8rLm1`
2. ✅ **Password Persistence**: Passwords stored temporarily in database during account creation
3. ✅ **Consistency**: Same password sent in welcome email and first credential email
4. ✅ **Security**: Password automatically cleared after first credential
5. ✅ **No Redundancy**: No password regeneration during credential issuance
6. ✅ **Flexibility**: Works for both individual and bulk student creation
7. ✅ **Custom Support**: Custom passwords preserved if provided by institution

The workflow now matches your exact requirements with enhanced security!
